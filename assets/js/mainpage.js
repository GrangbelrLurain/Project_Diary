module.exports = function addEvent(){
  const listBtn = document.querySelector(".nav .list")
  const aside = document.querySelector("#view .aside")
  listBtn.addEventListener("click", (event) => {
    event.preventDefault();

    listBtn.classList.toggle("active");
    aside.classList.toggle("active");
  })
}