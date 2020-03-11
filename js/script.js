/*****************

ChartYourMusic

******************/

function resizeTiles() {
    $('.tile').each((i, tile) => {
        tile.style.height = tile.borderWidth+'px';
    });
}

resizeTiles();
window.onresize = resizeTiles;
