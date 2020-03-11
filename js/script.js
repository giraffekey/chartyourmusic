/*****************

ChartYourMusic

******************/

function resizeTiles() {
    $('.tile').each((i, tile) => {
        tile.style.height = tile.offsetWidth+'px';
    });
}

resizeTiles();
window.onresize = resizeTiles;
