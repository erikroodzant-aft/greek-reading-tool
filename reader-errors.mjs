export function bookLoadMessage(protocol) {
  return protocol === "file:"
    ? "This reader needs a local web server. Open start-reader.cmd and use the address it displays, then try again."
    : "Could not load this book. Check your connection and select Go to retry. If the problem continues, report the passage on GitHub.";
}
