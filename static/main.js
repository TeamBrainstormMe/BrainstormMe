//slider menu
var colors = document.querySelector('.colors')
var cIcon = document.querySelector('#cIcon');
cIcon.addEventListener('click', function() {
    colors.classList.toggle('active');
})

var penSize = document.querySelector('.pen-size')
var penIcon = document.querySelector('#penIcon');
penIcon.addEventListener('click', function() {
    penSize.classList.toggle('active');
})