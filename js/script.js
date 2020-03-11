/*****************

ChartYourMusic

******************/

function optionsArrow() {
    let arrow = $('#optionsArrow');
    if(arrow.html()==='&#9660;')
      arrow.html('&#9650;');
    else
      arrow.html('&#9660;');
}

function resizeTiles() {
    $('.tile').each((i, tile) => {
        tile.style.height = tile.borderWidth+'px';
    });
}

resizeTiles();
window.onresize = resizeTiles;
