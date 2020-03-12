/*****************

ChartYourMusic

******************/

function optionsArrow() {
    let arrow = $('#optionsArrow');
    if(arrow.html()==='Options ▼')
        arrow.html('Options ▲');
    else
        arrow.html('Options ▼');
}

function resize() {
    $('img').each((i, img) => {
        img.style.height = img.borderWidth+'px';
    });
}

resize();
window.onresize = resize;

function fetch(url, ready) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            ready(this.responseText);
        }
    };
    http.open('GET', url);
    http.send();
}

function getAlbums() {
    let artist = $('#artist').val();
    let album = $('#album').val();
    $('#results').html('');
    fetch(`https://musicbrainz.org/ws/2/release?query=${album}&limit=5?inc=artist-credit&fmt=json`,
    (resp) => {
        const releases = JSON.parse(resp).releases;
        for(let i = 0; i < releases.length; i++) {
            console.log(releases[i]['artist-credit'][0].name);
            fetch('https://coverartarchive.org/release/'+releases[i]['id'],
            (resp) => {
                const images = JSON.parse(resp).images;
                for(let i = 0; i < images.length; i++) {
                    $('#results').append(`
                        <img src="${images[i]['image']}">
                    `);
                }
            });
        }
    });
}

function getAlbumsEnter(e) {
    if(e.key === 'Enter') {
        getAlbums();
    }
}

$('#artist').keypress(getAlbumsEnter);
$('#album').keypress(getAlbumsEnter);
