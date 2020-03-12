/*****************

ChartYourMusic

******************/

function optionsArrow() {
<<<<<<< HEAD
    let arrow = $('#optionsArrow');
    if(arrow.html()==='Options ▼')
        arrow.html('Options ▲');
    else
        arrow.html('Options ▼');
=======
  let arrow = $('#optionsArrow');
  if (arrow.html() === '▼')
    arrow.html('▲');
  else
    arrow.html('▼');
>>>>>>> 05dadee51e358a1acd9318e3dd1a785e38612d40
}

function resize() {
  $('img').each((i, img) => {
    img.style.height = img.borderWidth + 'px';
  });
}

resize();
window.onresize = resize;

function fetch(url, ready) {
  let http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      ready(this.responseText);
    }
  };
  http.open('GET', url);
  http.send();
}

function checkEnter() {
  $('#album').on('keypress', function(e) {
    if (e.which === 13) {
      getAlbums();
    }
  });
}

function getAlbums() {
  let artist = $('#artist').val();
  let album = $('#album').val();
  $('#results').html('');
  fetch(`https://musicbrainz.org/ws/2/release?query=${album}&limit=5?inc=artist-credit&fmt=json`,
    (resp) => {
      const releases = JSON.parse(resp).releases;
      for (let i = 0; i < releases.length; i++) {
        console.log(releases[i]['artist-credit'][0].name);
        fetch('https://coverartarchive.org/release/' + releases[i]['id'],
          (resp) => {
            const images = JSON.parse(resp).images;
            for (let i = 0; i < images.length; i++) {
              $('#results').append(`
                        <img class="ui-draggable" src="${images[i]['image']}">
                    `)
              $(".ui-draggable").draggable({
                containment: "document",
                scroll: false,
                stack: "img.ui-draggable"
              })
              // .mousedown(function () {
              let stack = $(".ui-draggable").draggable("option", "stack");
              $(".ui-draggable").draggable("option", "stack", "img.ui-draggable");
              // });
            }
          });
      }
    });
}

<<<<<<< HEAD
function getAlbumsEnter(e) {
    if(e.key === 'Enter') {
        getAlbums();
    }
}

$('#artist').keypress(getAlbumsEnter);
$('#album').keypress(getAlbumsEnter);
=======
// https://stackoverflow.com/questions/5941631/compile-save-export-html-as-a-png-image-using-jquery
>>>>>>> 05dadee51e358a1acd9318e3dd1a785e38612d40
