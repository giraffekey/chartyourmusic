/*****************

ChartYourMusic

******************/

function optionsArrow() {
  let arrow = $('#optionsArrow');
  if (arrow.html() === 'Options ▼')
    arrow.html('Options ▲');
  else
    arrow.html('Options ▼');
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
        fetch('https://coverartarchive.org/release/' + releases[i]['id'],
          (resp) => {
            const images = JSON.parse(resp).images;
            for (let i = 0; i < images.length; i++) {
                let img = document.createElement('img');
                img.src = images[i]['image'];
                $(img).draggable({
                    appendTo: 'body',
                    zIndex: 10,
                    helper: 'clone',
                    start: (e, ui) => {
                        $(ui.helper).css({'width': $('#results').width() / 2});
                    }
                });
                $('#results').append(img);
            }
        });
      }
    });
}

$('.tile').droppable({
    accept: '.ui-draggable',
    drop: (e, ui) => {
        e.target.src = $(ui.draggable).attr('src');
    }
});

// https://stackoverflow.com/questions/5941631/compile-save-export-html-as-a-png-image-using-jquery
