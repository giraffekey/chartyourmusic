/*****************

ChartYourMusic

******************/

let sources = [];
for(let i = 0; i < 9; i++) {
  sources.push("assets/images/blank.png");
}

let options = {
  grid: false
};

let dragIndex = -1;

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
            img.className = 'result';
            $(img).draggable({
              appendTo: 'body',
              zIndex: 10,
              helper: 'clone',
              start: (e, ui) => {
                let size = $('#results').width() / 2;
                $(ui.helper).css({width: size, height: size});
              }
            });
            $('#results').append(img);
            img.style.height = img.borderWidth + 'px';
          }
      });
    }
  });
}

function chartToImage(ext) {
  html2canvas(document.getElementById('chart')).then(
    (canvas) => {
      if(ext === 'jpg')
        Canvas2Image.saveAsJPEG(canvas);
      else if(ext === 'png')
        Canvas2Image.saveAsPNG(canvas);
    }
  );
}

function repaintChart() {
  let images = $('#chart img');
  for(let i = 0; i < images.length; i++) {
    images.get(i).src = sources[i];
  }
}

function generateChart() {
  let innerHTML = '';
  for(let i = 0; i < sources.length; i++) {
    let tile_n = 'tile-1';
    if(!options.grid) {
      if(i >= 52) tile_n = 'tile-4';
      else if(i >= 22) tile_n = 'tile-3';
      else if(i >= 10) tile_n = 'tile-2';
    }

    innerHTML += `
      <img class="tile ${tile_n}" src="${sources[i]}">
    `;
  }

  $('#chart').html(innerHTML);

  $('.tile').droppable({
    accept: '.ui-draggable',
    drop: (e, ui) => {
      let images = $('#chart img');
      if($(ui.draggable).hasClass('result')) {
        sources[images.index(e.target)] = $(ui.draggable).attr('src');      
        repaintChart();
      } else if($(ui.draggable).hasClass('tile')) {
        e.target.style.opacity = 1;
        dragIndex = -1;
      }
    },
    over: (e, ui) => {
      let images = $('#chart img');
      if($(ui.draggable).hasClass('tile')) {
        if(dragIndex === -1) dragIndex = images.index(ui.draggable);
        let src = sources.splice(dragIndex, 1);
        sources.splice(images.index(e.target), 0, src);
        dragIndex = images.index(e.target);
        repaintChart();
        $(ui.helper).attr('src', src);
        e.target.style.opacity = 0;
      }
    },
    out: (e, ui) => {
      if($(ui.draggable).hasClass('tile'))
        e.target.style.opacity = 1;
    }
  });

  $('.tile').draggable({
    zIndex: 10,
    helper: 'clone',
    start: (e, ui) => {
      let width = $('#chart').width();
      let target = $(e.target);
      let helper = $(ui.helper);
      if(target.hasClass('tile-1'))
        helper.css({width: width / 5});
      else if(target.hasClass('tile-2'))
        helper.css({width: width / 6});
      else if(target.hasClass('tile-3'))
        helper.css({width: width / 10});
      else if(target.hasClass('tile-4'))
        helper.css({width: width / 14});
    }
  });
}

window.onresize = resize;
generateChart();
resize();
