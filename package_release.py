"""Create a checked, reproducible release folder and stable ZIP names."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent


def inventory():
    spec = json.loads((ROOT / "release-files.json").read_text(encoding="utf-8"))
    files = {Path(name) for name in spec["files"]}
    for name in spec["directories"]:
        files.update(p.relative_to(ROOT) for p in (ROOT / name).rglob("*") if p.is_file())
    for relative in files:
        path = ROOT / relative
        if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(ROOT):
            raise ValueError(f"Missing or unsafe release asset: {relative}")
        if any(part in {".git", "__pycache__", "node_modules"} for part in relative.parts):
            raise ValueError(f"Excluded directory in release: {relative}")
    return sorted(files, key=lambda p: p.as_posix())


def build(output, git):
    output = output.resolve()
    if output == ROOT or output.is_relative_to(ROOT):
        raise ValueError("Choose an output directory outside the source checkout")
    output.mkdir(parents=True, exist_ok=True)
    commit = subprocess.check_output([git, "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    dirty = bool(subprocess.check_output([git, "status", "--porcelain", "--untracked-files=all"], cwd=ROOT, text=True).strip())
    files = inventory()
    with tempfile.TemporaryDirectory(prefix="heleios-release-") as temporary:
        stage = Path(temporary) / "Greek-Reading-Tool"
        stage.mkdir()
        hashes = {}
        for relative in files:
            destination = stage / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
            hashes[relative.as_posix()] = hashlib.sha256(destination.read_bytes()).hexdigest()
        manifest = {"sourceCommit": commit, "uncommittedChanges": dirty,
                    "status": "local-preview" if dirty else "committed-snapshot", "sha256": hashes}
        (stage / "release-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        subprocess.run(["node", "--test", *[str(p.name) for p in sorted(stage.glob("*.test.mjs"))]], cwd=stage, check=True)
        subprocess.run([__import__("sys").executable, str(stage / "check_release.py")], cwd=stage, check=True)
        target = output / "Greek-Reading-Tool"
        # Only replace the fixed generated folder after its absolute boundary is checked.
        if target.is_symlink() or (target.exists() and target.resolve().parent != output):
            raise ValueError("Unsafe generated folder")
        if target.exists() and any(p.is_symlink() for p in target.rglob("*")):
            raise ValueError("Generated folder contains a symlink; choose a clean output directory")
        target.mkdir(exist_ok=True)
        # Keep the root directory: a running local server may use it as its cwd.
        # Copy checked files before pruning obsolete generated assets.
        shutil.copytree(stage, target, dirs_exist_ok=True)
        expected = {p.relative_to(stage) for p in stage.rglob("*")}
        for path in sorted(target.rglob("*"), key=lambda p: len(p.parts), reverse=True):
            if path.relative_to(target) not in expected:
                if path.is_symlink() or path.is_file():
                    path.unlink()
                elif path.is_dir():
                    path.rmdir()
        archive = output / "Greek-Reading-Tool.zip"
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
            for path in sorted(stage.rglob("*")):
                if path.is_file():
                    name = "Greek-Reading-Tool/" + path.relative_to(stage).as_posix()
                    info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = 0o100644 << 16
                    zipped.writestr(info, path.read_bytes(), compresslevel=9)
        shutil.copyfile(archive, output / "Greek-Reading-Tool-GitHub.zip")
    print(f"Packaged {len(files)} source assets; {manifest['status']}; commit {commit}")
    print(archive)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--git", default="git", help="Git executable, or its full path on Windows")
    args = parser.parse_args()
    build(args.output, args.git)
