for (const form of document.querySelectorAll(".home-works form")) {
  const {book, line} = form.elements;
  for (let number = 1; number <= 24; number++) book.add(new Option(number, number));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const passage = new URLSearchParams({work: form.dataset.work, book: book.value, line: line.value});
    location.href = "reader.html#" + passage;
  });
}
