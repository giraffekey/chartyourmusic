/*****************

ChartYourMusic

@author GiraffeKey and sorwu

******************/

// Array for the chart list
let charts = [];

// Handle for the selected chart
let chart;

// Index of selected chart
let chartIndex;

// Helps with dynamic reordering during drag & drop
let dragIndex = -1;

// Helps with fix for when there's too many titles
let maxHeight = false;

/**
 * For options dropdown visuals
 */
function optionsArrow() {
  let arrow = $('#optionsArrow');
  if (arrow.html() === 'Options ▼')
    arrow.html('Options ▲');
  else
    arrow.html('Options ▼');
}

/**
 * Resize images in #results and #charts to keep them square
 */
function resize() {
  $('img').each((i, img) => {
    img.style.maxHeight = img.borderWidth + 'px';
    img.style.minHeight = img.borderWidth + 'px';
  });
}

/**
 * Ajax request
 * @param {String} url 
 * @param {Function} success 
 */
function fetch(url, success) {
  let http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      success(this.responseText);
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
  $('#chartName').on('keypress', function (e) {
    if (e.which === 13) {
      $('#btnCreate').click();
    }
  });
}

/**
 * Fill #results with album covers based on search terms
 */
function getAlbums() {
  let artist = $('#artist').val();
  let album = $('#album').val();
  $('#results').html('');
  // Avoids duplicate urls in results
  let sourceList = [];
  let query = 
    (album ? 'release:'+album : '') +
    (album && artist ? ' AND ' : '') +
    (artist ? 'artist:'+artist : '')
  ;
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

/**
 * Takes a screenshot of #chart and downloads it as an image
 * @param {String} ext - png or jpg
 */
function chartToImage(ext) {
  $('#chartContainer').css({border: 'none'});
  html2canvas(document.getElementById('chartContainer'), {useCORS: true}).then(
    (canvas) => {
      let context = canvas.getContext('2d');
      let images = $('#chart img');

      for(let i = 0; i < images.length; i++) {
        if(chart.sources[i] !== 'assets/images/blank.png') {
          let img = new Image();
          img.src = chart.sources[i];
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

/**
 * Rearranges the artwork and titles for visible chart
 */
function repaintChart() {
  let images = $('#chart img');
  for(let i = 0; i < images.length; i++) {
    images.get(i).src = chart.sources[i];
  }

  let height = $('#chartContainer').height();
  
  $('#titles').html('');
  for(let i = 0; i < images.length; i++) {
    if(titles[i].length > 0) {
      let input = document.createElement('input');
      input.type = 'text';
      input.className = 'title';
      input.value = chart.titles[i];
      input.style.width = input.value.length*0.55+'em';
      $(input).change((e) => {
        chart.titles[$('.title').index(e.target)] = e.target.value;
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

/**
 * Generates tiles in #chart when tile amount changes
 */
function generateChart() {
  let innerHTML = '';
  let length = 
    chart.options.grid 
    ? chart.options.rows * chart.options.cols 
    : chart.options.length
  ;
  for(let i = 0; i < length; i++) {
    // Makes tiles get smaller as they go down unless chart is in a grid
    let tile_n = 'tile-1';
    if(!chart.options.grid) {
      if(i >= 52) tile_n = 'tile-4';
      else if(i >= 22) tile_n = 'tile-3';
      else if(i >= 10) tile_n = 'tile-2';
    }

    innerHTML += `<img class="tile ${tile_n}" src="${chart.sources[i]}"`;
    if(tile_n === 'tile-1')
      innerHTML += ` style="width: ${chart.options.grid ? 100 / chart.options.cols : 20}%"`
    innerHTML += '>';
  }
  $('#chart').html(innerHTML);

  // Clear tile on double click
  $('.tile').dblclick(function(e) {
    let index = $('#chart img').index(e.target);
    chart.sources[index] = 'assets/images/blank.png';
    chart.titles[index] = '';
    repaintChart();
  });

  $('.tile').droppable({
    accept: '.ui-draggable',
    // Search result? set source and title of tile
    // Another tile? create visual drop effect
    drop: (e, ui) => {
      let images = $('#chart img');
      if($(ui.draggable).hasClass('result')) {
        let index = images.index(e.target);
        chart.sources[index] = $(ui.draggable).attr('src'); 
        chart.titles[index] = $(ui.draggable).attr('title');
        repaintChart();
      } else if($(ui.draggable).hasClass('tile')) {
        e.target.style.opacity = 1;
        dragIndex = -1;
      }
    },
    // Dynamically rearranges chart during hover
    over: (e, ui) => {
      let images = $('#chart img');
      if($(ui.draggable).hasClass('tile')) {
        // Moves source image into position mouse is hovering over
        // dragIndex is necessary because location of source image changes
        if(dragIndex === -1) dragIndex = images.index(ui.draggable);
        let moveto = images.index(e.target);
        let src = chart.sources.splice(dragIndex, 1);
        chart.sources.splice(moveto, 0, src);
        let title = chart.titles.splice(dragIndex, 1);
        chart.titles.splice(moveto, 0, title);
        dragIndex = moveto;
        repaintChart();
        // Makes sure dragged image doesn't change its source
        $(ui.helper).attr('src', src);
        // Create illusion of a blank drop space
        e.target.style.opacity = 0;
      }
    },
    // Removes blank space when not hovering over
    out: (e, ui) => {
      if($(ui.draggable).hasClass('tile'))
        e.target.style.opacity = 1;
    }
  });

  $('.tile').draggable({
    // If not appended to body $('#chart img') will include dragged clone
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

/**
 * Create a new chart and add to list
 */
function newChart() {
  charts.push({
    name: $('#chartName').val(),
    sources: [],
    titles: [],
    options: {
      grid: false,
      rows: 3,
      cols: 3,
      length: 40,
      outerPadding: 10,
      innerPadding: 4,
      titles: false,
      font: 'Arial',
      background: ''
    }
  });

  for(let i = 0; i < 144; i++) {
    charts[charts.length-1].sources.push('assets/images/blank.png');
    charts[charts.length-1].titles.push('');
  }

  $(chartItemString(charts[charts.length - 1].name)).insertBefore('#createChart');
  loadChart(charts.length - 1);
}

/**
 * Change active chart data
 * @param {Number} index
 */
function loadChart(index) {
  charts[chartIndex] = chart;
  chart = charts[index];
  chartIndex = index;

  storeToJSON();

  $('.chart-item.selected input[type=checkbox]').prop('checked', false);
  $('.chart-item.selected').removeClass('selected');
  $($('.chart-item').get(chartIndex)).addClass('selected');
  $('.chart-item.selected input[type=checkbox]').prop('checked', true);

  if(chart.options.grid) {
    $('#gridRadio').attr('checked', true);
  } else {
    $('#collageRadio').attr('checked', true);
  }

  $('#rows').val(chart.options.rows);
  $('#cols').val(chart.options.cols);
  $('#tiles').val(chart.options.length);
  $('#outerPadding').val(chart.options.outerPadding);
  $('#innerPadding').val(chart.options.innerPadding);

  if(chart.options.titles) {
    $('#titleToggle').attr('checked', true);
  } else {
    $('#titles').hide();
  }

  $('#fonts').val(chart.options.font);
  $('#background').val(chart.options.background);

  chartType(chart.options.grid);
  changeFont();
  background();
}

/**
 * Save data to localStorage
 */
function storeToJSON() {
  charts[chartIndex] = chart;
  localStorage.setItem('chartStorage', JSON.stringify({ charts, index: chartIndex }));
}

/**
 * Download chart data as json file
 */
function exportToJSON() {
  let file = new Blob([JSON.stringify(chart)], {type: 'json'});
  let filename = chart.name.toLowerCase().replace(/\s/g, '-') + '.json';
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

/**
 * Import chart data from file
 */
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
      fetch(URL.createObjectURL(document.getElementById('jsonImport').files[0]),
      resp => {
        charts.push(JSON.parse(resp));
        $(chartItemString(charts[charts.length - 1].name)).insertBefore('#createChart');
        loadChart(charts.length - 1);
      });
    });
  }
  else {
    $('#jsonImport').hide();
  }
}

/**
 * Generate chart images from RateYourMusic data
 */
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
      fetch(URL.createObjectURL(document.getElementById('csvImport').files[0]),
      resp => {
        resp = resp.replace(/""/g, '0');
        resp = resp.replace(
          'RYM Album, First Name,Last Name,First Name localized, Last Name localized,Title,Release_Date,Rating,Ownership,Purchase Date,Media Type,Review', 
          'RYM_Album,First_Name,Last_Name,First_Name_Localized,Last_Name_Localized,Title,Release_Date,Rating,Ownership,Purchase_Date,Media_Type,Review'
        );
        let userData = $.csv.toObjects(resp);
        userData = userData.sort((obj1, obj2) => obj2.Rating - obj1.Rating);
        let length = options.grid ? options.rows * options.cols : options.length;
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
                  let index = chart.sources.indexOf('assets/images/blank.png');
                  chart.sources[index] = JSON.parse(resp).images.find(img => img.front)['image'].replace('http:/', 'https:/');
                  chart.titles[index] = artist + ' - ' + obj.Title;
                  repaintChart();
                });
              }
            }
          );
        }
      });
    });
  }
  else {
    $('#csvImport').hide();
  }
}

/**
 * Changes between grid and collage display mode
 * @param {Boolean} grid
 */
function chartType(grid) {
  if(grid) {
    $('#chartContainer').css({width: Math.min(100, 40 + 10 * chart.options.cols) + '%'});
    $('#chartSize').show();
    $('#chartLength').hide();
  } else {
    $('#chartContainer').css({width: '100%'});
    $('#chartSize').hide();
    $('#chartLength').show();
  }
  chart.options.grid = grid;
  generateChart();
}

/**
 * Change rows and cols amount when in grid mode
 */
function chartSize() {
  let rows = $('#rows').val();
  let cols = $('#cols').val();
  chart.options.rows = rows;
  $('#rowsNum').html(rows);
  chart.options.cols = cols;
  $('#colsNum').html(cols);
  chartType(true);
}

/**
 * Change amount of tiles when in collage mode
 */
function chartLength() {
  chart.options.length = $('#tiles').val();
  generateChart();
}

/**
 * Padding for #chart and #titles
 */
function outerPadding() {
  let padding = $('#outerPadding').val();
  chart.options.outerPadding = padding;
  $('#chart').css({padding: padding * 2});
  $('#titles').css({paddingTop: padding * 2, paddingBottom: padding * 2, paddingRight: padding});
  $('#outerPaddingNum').html(padding);
}

/**
 * Padding between tiles
 */
function innerPadding() {
  let padding = $('#innerPadding').val();
  chart.options.innerPadding = padding;
  $('#chart img').css({padding: padding});
  $('#innerPaddingNum').html(padding);
}

/**
 * Show or hide titles list
 */
function titleToggle() {
  $('#titles').toggle();
  chart.options.titles = !chart.options.titles;
  resize();
}

/**
 * Change font of titles list
 */
function changeFont() {
  let font = $('#fonts').val() + ', sans-serif';
  chart.options.font = font;
  $('#titles').css('font-family', font);
}

/**
 * Background color or image of chart
 */
function background() {
  let val = $('#background').val().toLowerCase();
  if(val.includes('http') || val.includes('www')) {
    val = 'url(' + val + ')';
  }
  chart.options.background = val;
  $('#chartContainer').css('background', val);
}

/**
 * For the color picker
 */
function backgroundColor() {
  let val = $('#colorPicker').val();
  chart.options.background = val;
  $('#background').val(val);
  $('#chartContainer').css('background', val);
}

/**
 * Return chart-item html string
 */
function chartItemString(name) {
  return `
    <div class="chart-item d-flex flex-row justify-content-between align-items-center">
      <input type="checkbox" onclick="selectChart(event)">
      <input type="text" value="${name}" disabled>
      <button onclick="renameChart(event)">R</button>
      <button 
        onclick="
          $('#deleteTitle').html(
            'Are you sure you want to delete ' +
            $(event.target).siblings('input').val() + '?'
          )
          $('#btnDelete').click(() => deleteChart(event));
        "
        data-toggle="modal"
        data-target="#deleteChartModal"
      >🗑</button>
    </div>
  `;
}

/**
 * Change name of selected chart 
 */
function renameChart(e) {
  $(e.target).siblings('input[type=text]')
  .removeAttr('disabled').focus()
  .on('focusout change', e => {
    let input = e.target;
    $(input).attr('disabled', true);
    charts[$('.chart-item').index($(input).parent())].name = $(input).val();
    storeToJSON();
  });
}

/**
 * Remove chart from list
 */
function deleteChart(e) {
  let div = $(e.target).parent();
  let index = $('.chart-item').index(div);
  charts.splice(index, 1);
  if(charts.length > 0) {
    loadChart(chartIndex);
  } else {
    $('#createChart').click();
  }
  $(div).remove();
}

/**
 * Select and load a chart from the list
 */
function selectChart(e) {
  loadChart($('.chart-item').index($(e.target).parent()));
}

/**
 * Runs when window is ready
 */
$(() => {
  $('#csvImport, #jsonImport').hide();

  let data = JSON.parse(localStorage.getItem('chartStorage'));

  if(data) {
    charts = data.charts;
    let innerHTML = '';
    charts.forEach(item => {
      innerHTML += chartItemString(item.name);
    });
    $('#chartList').prepend(innerHTML);
    loadChart(data.index);
  } else {
    $('#createChart').click();
  }

  window.onresize = resize;
});
