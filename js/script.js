/*****************

ChartYourMusic

******************/

// For keeping track of album covers and their order
let sources = [];
let titles = [];
for(let i = 0; i < 144; i++) {
  sources.push('assets/images/blank.png');
  titles.push('');
}

// Options for editing the look of the chart
let options = {
  grid: false,
  rows: $('#rows').val(),
  cols: $('#cols').val(),
  length: $('#tiles').val()
};

// Helps with dynamic reordering during drag & drop
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
  $('#album, #artist').on('keypress', function(e) {
    if (e.which === 13) {
      getAlbums();
    }
  });
}

function getAlbums() {
  let artist = $('#artist').val();
  let album = $('#album').val();
  $('#results').html('');
  let query = (album ? 'release:'+album : '') + (album&&artist?'AND':'') + (artist ? 'artist:'+artist : '');
  // Retrieve list of albums that match the search input
  fetch(`https://musicbrainz.org/ws/2/release?query=${query}&limit=40?inc=artist-credit&fmt=json`,
  resp => {
    let releases = JSON.parse(resp).releases;
    for (let i = 0; i < releases.length; i++) {
      let rel = releases[i];
      // Retrieve all variations of cover art for each release
      fetch('https://coverartarchive.org/release/' + rel['id'],
        resp => {
          JSON.parse(resp).images.forEach(image => {
            let img = document.createElement('img');
            img.src = image['image'];
            img.title = rel['artist-credit'][0]['name'] + ' - ' + rel['title'];
            img.className = 'result';
            $(img).draggable({
              appendTo: 'body',
              zIndex: 10,
              helper: 'clone',
              start: (e, ui) => {
                // Fixes issue where dragged image is much larger than source image
                let size = $('#results').width() / 2;
                $(ui.helper).css({width: size, height: size});
              }
            });
            $('#results').append(img);
            img.style.height = img.borderWidth + 'px';
          });
        }
      );
    }
  });
}

function chartToImage(ext) {
  html2canvas(document.getElementById('chartContainer'), {
    useCORS: true,
    onrendered: (canvas) => {
      let context = canvas.getContext('2d');
      let images = $('#chart img');

      for(let i = 0; i < images.size(); i++) {
        if(sources[i] !== 'assets/images/blank.png') {
          let img = new Image();
          img.src = sources[i];
          let x = images.get(i).position().left;
          let y = images.get(i).position().top;
          img.onload = () => {
            context.drawImage(img, x, y);
          }
        }
      }

      document.body.appendChild(canvas);
      if(ext === 'jpg')
        Canvas2Image.saveAsJPEG(canvas);
      else if(ext === 'png')
        Canvas2Image.saveAsPNG(canvas);
    }
  });
}

// For rearranging the artwork of the tiles
function repaintChart() {
  let images = $('#chart img');
  for(let i = 0; i < images.length; i++) {
    images.get(i).src = sources[i];
  }
  
  $('#titles').html('');
  for(let i = 0; i < images.length; i++) {
    if(titles[i]) {
      let input = document.createElement('input');
      input.type = 'text';
      input.className = 'title';
      input.value = titles[i];
      input.size = input.value.length * 0.75;
      $(input).change((e) => {
        titles[$('.title').index(e.target)] = e.target.value;
        e.target.size = e.target.value.length * 0.75;
      });
      $('#titles').append(input);
    }
    if((i + 1) % options.cols == 0 && options.grid) {
      $('#titles').append('<div class="pt-3"></div>');
    }
  }
}

// For changing the number of or size of tiles in the chart
function generateChart() {
  let innerHTML = '';
  let length = options.grid ? options.rows*options.cols : options.length;
  for(let i = 0; i < length; i++) {
    // Makes tiles get smaller as they go down unless chart is in a grid
    let tile_n = 'tile-1';
    if(!options.grid) {
      if(i >= 52) tile_n = 'tile-4';
      else if(i >= 22) tile_n = 'tile-3';
      else if(i >= 10) tile_n = 'tile-2';
    }

    innerHTML += `<img class="tile ${tile_n}" src="${sources[i]}"`;
    if(tile_n === 'tile-1')
      innerHTML += ` style="width: ${options.grid ? 100 / options.cols : 20}%"`
    innerHTML += '>';
  }
  $('#chart').html(innerHTML);

  $('.tile').droppable({
    accept: '.ui-draggable',
    drop: (e, ui) => {
      let images = $('#chart img');
      if($(ui.draggable).hasClass('result')) {
        let index = images.index(e.target);
        sources[index] = $(ui.draggable).attr('src'); 
        titles[index] = $(ui.draggable).attr('title');
        repaintChart();
      } else if($(ui.draggable).hasClass('tile')) {
        e.target.style.opacity = 1;
        dragIndex = -1;
      }
    },
    over: (e, ui) => {
      let images = $('#chart img');
      if($(ui.draggable).hasClass('tile')) {
        // Moves source image into position mouse is hovering over
        // dragIndex is necessary because location of source image changes
        if(dragIndex === -1) dragIndex = images.index(ui.draggable);
        let moveto = images.index(e.target);
        let src = sources.splice(dragIndex, 1);
        sources.splice(moveto, 0, src);
        let title = titles.splice(dragIndex, 1);
        titles.splice(moveto, 0, title);
        dragIndex = moveto;
        repaintChart();
        // Makes sure dragged image doesn't change its source
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
      // Makes sure dragged image is the same size as original tile
      if(target.hasClass('tile-1'))
        helper.css({width: width / 5, height: width / 5});
      else if(target.hasClass('tile-2'))
        helper.css({width: width / 6, height: width / 6});
      else if(target.hasClass('tile-3'))
        helper.css({width: width / 10, height: width / 10});
      else if(target.hasClass('tile-4'))
        helper.css({width: width / 14, height: width / 14});
    }
  });

  resize();
  outerPadding();
  innerPadding();
}

function chartType(grid) {
  if(grid) {
    $('#chartContainer').css({width: Math.min(100, 40 + 10 * options.cols) + '%'});
    $('#chartSize').show();
    $('#chartLength').hide();
  } else {
    $('#chartContainer').css({width: '100%'});
    $('#chartSize').hide();
    $('#chartLength').show();
  }
  options.grid = grid;
  generateChart();
}

function chartSize() {
  let rows = $('#rows').val();
  let cols = $('#cols').val();
  options.rows = rows;
  $('#rowsNum').html(rows);
  options.cols = cols;
  $('#colsNum').html(cols);
  chartType(true);
}

function chartLength() {
  options.length = $('#tiles').val();
  generateChart();
}

function outerPadding() {
  let padding = $('#outerPadding').val()
  $('#chart').css({padding: padding * 2});
  $('#outerPaddingNum').html(padding);
}

function innerPadding() {
  let padding = $('#innerPadding').val();
  $('#chart img').css({padding: padding});
  $('#innerPaddingNum').html(padding);
}

function titleToggle() {
  $('#titles').toggle();
  resize();
}

function changeFont() {
  $('#titles').css('font-family', $('#fonts').val() + ', sans-serif');
}

function background() {
  let val = $('#background').val().toLowerCase();
  if(val.includes('http') || val.includes('www')) {
    val = 'url(' + val + ')';
  }
  $('#chartContainer').css('background', val);
}

function backgroundColor() {
  let val = $('#colorPicker').val();
  $('#background').val(val);
  $('#chartContainer').css('background', val);
}

function storeToJSON() {
  // Put the chart into an array
  let inputJSON = $('#chart').toArray();
  // Convert to JSON from js Array
  let chartStorage = JSON.stringify(inputJSON);
  // Set the JSON in the localStorage
  let setJSON = localStorage.setItem('chartStorage', chartStorage);
  // Optionally retrieve this *for when export is clicked in the future
  let getJSON = JSON.parse(localStorage.getItem('chartStorage'));
  
  console.log(`
  ${inputJSON}
  ${chartStorage}
  ${setJSON}
  ${getJSON}`);
}

function importFromJSON() {
  if ($('#jsonImport').is(':hidden')) {
    $('#jsonImport').show();
    $('#jsonImport').dialog({
      draggable: false,
      modal: true,
      resizable: false,
      title: 'JSON Import Data:'
    });
    
    $('#jsonImport').change(() => {
      let jsonUpload = URL.createObjectURL(document.getElementById('jsonImport').files[0]);

      $.ajax({
        type: 'GET',
        url: jsonUpload,
        dataType: 'text json',
        success: function (response) {
          // PARSE JSON HERE
          console.log(jsonData);
        }
      });
    });
  }
  else {
    $('#jsonImport').hide();
  }
}

function importFromRYM() {
  if ($('#csvImport').is(':hidden')) {
    $('#csvImport').show();
    $('#csvImport').dialog({
      draggable: false,
      modal: true,
      resizable: false,
      title: 'RYM Import Data:'
    });
    
    $('#csvImport').change(() => {
      let userUpload = URL.createObjectURL(document.getElementById('csvImport').files[0]);

      $.ajax({
        type: 'GET',
        url: userUpload,
        dataType: 'text',
        success: function (response) {
          response = response.replace(/""/g, '0');
          response = response.replace(
            'RYM Album, First Name,Last Name,First Name localized, Last Name localized,Title,Release_Date,Rating,Ownership,Purchase Date,Media Type,Review', 
            'RYM_Album,First_Name,Last_Name,First_Name_Localized,Last_Name_Localized,Title,Release_Date,Rating,Ownership,Purchase_Date,Media_Type,Review'
          );
          let userData = $.csv.toObjects(response);
          userData = userData.sort((obj1, obj2) => obj2.Rating - obj1.Rating);
          let length = Math.min(144, 4*(options.grid ? options.rows * options.cols : options.length));
          for(let i = 0; i < length; i++) {
            let obj = userData[i];
            let artist = (obj.First_Name == 0 ? "" : obj.First_Name+" ")+obj.Last_Name;
            let query = 'release:'+obj.Title+'ANDartist:'+artist;
            window.setTimeout(
              fetch, 700 * i,
              `https://musicbrainz.org/ws/2/release?query=${query}&limit=40?inc=artist-credit&fmt=json`,
              resp => {
                let release = JSON.parse(resp).releases.find(
                  release => release.title == obj.Title
                );
                if(release) {
                  fetch('https://coverartarchive.org/release/' + release['id'],
                    resp => {
                      let index = sources.indexOf('assets/images/blank.png');
                      sources[index] = JSON.parse(resp).images.find(img => img.front)['image'];
                      titles[index] = artist + ' - ' + obj.Title;
                      repaintChart();
                    }
                  );
                }
              }
            );
          }
        }
      });
    });
  }
  else {
    $('#csvImport').hide();
  }
}

$(() => {
  $('#chartSize').hide();
  $('#rowsNum').html($('#rows').val());
  $('#colsNum').html($('#cols').val());

  $("#csvImport").hide();
  $("#jsonImport").hide();

  if(!$('#titleToggle').is(':checked'))
    $('#titles').hide();

  chartType($('#gridRadio').is(':checked'));
  background();

  generateChart();
  window.onresize = resize;
})
