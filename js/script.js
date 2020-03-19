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

// Count each chart
let chartCount = 1;

// Helps with dynamic reordering during drag & drop
let dragIndex = -1;

// Helps with fix for when there's too many titles
let maxHeight = false;

function optionsArrow() {
  let arrow = $('#optionsArrow');
  if (arrow.html() === 'Options ▼')
    arrow.html('Options ▲');
  else
    arrow.html('Options ▼');
}

function resize() {
  $('img').each((i, img) => {
    img.style.maxHeight = img.borderWidth + 'px';
    img.style.minHeight = img.borderWidth + 'px';
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
  let sourceList = [];
  let query = (album ? 'release:'+album : '') + (album&&artist?' AND ':'') + (artist ? 'artist:'+artist : '');
  // Retrieve list of albums that match the search input
  fetch(`https://musicbrainz.org/ws/2/release?query=${query}&limit=40?inc=artist-credit&fmt=json`,
  resp => {
    let releases = JSON.parse(resp).releases;
    for (let i = 0; i < releases.length; i++) {
      let rel = releases[i];
      fetch('https://coverartarchive.org/release/' + rel['id'],
      resp => {
        JSON.parse(resp).images.forEach(image => {
          let source = image['image'].replace('http:/', 'https:/');
          if(!sourceList.includes(source)) {
            let img = document.createElement('img');
            img.src = source;
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
            $(img).css({height: $('#results').width()/2});
            $('#results').append(img);
          }
        });
      });
    }
  });
}

function chartToImage(ext) {
  $('#chartContainer').css({border: 'none'});
  html2canvas(document.getElementById('chartContainer'), {useCORS: true}).then(
    (canvas) => {
      let context = canvas.getContext('2d');
      let images = $('#chart img');

      for(let i = 0; i < images.length; i++) {
        if(sources[i] !== 'assets/images/blank.png') {
          let img = new Image();
          img.src = sources[i];
          let x = $(images[i]).position().left;
          let y = $(images[i]).position().top;
          context.drawImage(img, x, y);
        }
      }

      document.body.appendChild(canvas);
      if(ext === 'jpg')
        Canvas2Image.saveAsJPEG(canvas);
      else if(ext === 'png')
        Canvas2Image.saveAsPNG(canvas);
      document.body.removeChild(canvas);
      $('#chartContainer').css({border: '1px solid white'});
    }
  );
}

// For rearranging the artwork of the tiles
function repaintChart() {
  let images = $('#chart img');
  for(let i = 0; i < images.length; i++) {
    images.get(i).src = sources[i];
  }

  let height = $('#chartContainer').height();
  
  $('#titles').html('');
  for(let i = 0; i < images.length; i++) {
    if(titles[i].length > 0) {
      let input = document.createElement('input');
      input.type = 'text';
      input.className = 'title';
      input.value = titles[i];
      input.style.width = input.value.length*0.55+'em';
      $(input).change((e) => {
        titles[$('.title').index(e.target)] = e.target.value;
        e.target.style.width = e.target.value.length*0.55+'em';
      });
      $('#titles').append(input);
    }
  }

  if($('#chartContainer').height() > height && !maxHeight) {
    $('#chart').css({maxHeight: height});
    maxHeight = true;
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

  $('.tile').dblclick(function(e) {
    let index = $('#chart img').index(e.target);
    sources[index] = 'assets/images/blank.png';
    titles[index] = '';
    repaintChart();
  });

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
    appendTo: 'body',
    zIndex: 10,
    helper: 'clone',
    start: (e, ui) => {
      $(ui.helper).css({width: e.target.offsetWidth, height: e.target.offsetHeight});
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
  $('#titles').css({paddingTop: padding * 2, paddingBottom: padding * 2, paddingRight: padding});
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

function addChart() {
  chartCount ++;
  $('#addChart').replaceWith( `
    <div class="chart-item">
      <span>Chart #${chartCount}</span>
    </div>
    <button id="addChart" class="btn btn-light btn-sm" onclick="addChart()">Add chart</button>`);
}

function storeToJSON() {
  localStorage.setItem('chartStorage', JSON.stringify({sources, titles, options}));
}

function exportToJSON() {
  let file = new Blob([JSON.stringify({sources, titles, options})], {type: 'json'});
  let filename = 'chart.json';
  if(window.navigator.msSaveOrOpenBlob) { // Internet Explorer
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else { // Actual web browsers
    let a = document.createElement("a")
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);  
  }
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
        dataType: 'text',
        success: function (response) {
          [sources, titles, options] = Object.values(JSON.parse(response));
          generateChart();
          repaintChart();
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
              fetch, 1000 * i,
              `https://musicbrainz.org/ws/2/release?query=${query}&limit=40?inc=artist-credit&fmt=json`,
              resp => {
                let release = JSON.parse(resp).releases.find(
                  release => release.title == obj.Title
                );
                if(release) {
                  fetch('https://coverartarchive.org/release/' + release['id'],
                    resp => {
                      let index = sources.indexOf('assets/images/blank.png');
                      sources[index] = JSON.parse(resp).images.find(img => img.front)['image'].replace('http:/', 'https:/');
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
