var fs = require('fs');
var urllib = require('url');
var querystring = require('querystring');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var flatten = require('array-flatten');

USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';
BASE_URL = 'https://www.usbanklocations.com/banks.php?q=MUFG+Union+Bank&ml=15&lc=&city=&state=&name=&ct=22826&ad=&sb=location&ps=';
LAST_PAGE_NUMBER = 36

URLS_FILE = 'urls/urls.json'
OUT_FILE = './out.json'

req = request.defaults({
    timeout: 5000,
    rejectUnauthorized: false, 
    followAllRedirects: true   // allow redirections
});

function makeParams(uri, method) {
    var params = {
      uri: uri,
      method: method.toUpperCase(),
      headers: {
        'Host': urllib.parse(uri).hostname,
        'User-Agent': USER_AGENT
      }
    };

    return params;
}

function cheeriolize(params, cb) {
    req(params, function(err, status, body) {
        if (err) {
            return cb(err, null);
        }
        // console.log(body);
        // fs.writeFileSync('/tmp/blah.html', body);
        const $ = cheerio.load(body);
        return cb(null, $);
    });
}


function getDoctorUrlsHelper(url, cb) {
    console.log(url);
    cheeriolize(makeParams(url, 'GET'), function(err, $) {
        if (err) {
            // return cb(err);
            setTimeout(function() {
                console.log('retrying ...');
                getDoctorPages(pageNumber, cb);
            }, 2000);
            return;
        }   

        var hrefs = new Set();

        $('.plb a[href^="/"]').each(function(i, elem) {
            href = $(elem).attr('href');
            hrefs.add(href);
        });

        $('.plw a[href^="/"]').each(function(i, elem) {
            href = $(elem).attr('href');
            hrefs.add(href);
        });

        hrefs = [...hrefs];
        
        console.log(hrefs);

        setTimeout(function() {
            cb(null, hrefs);
        }, 2000);
    });    
}

function getDoctorUrls() {
    pageNumbers = new Array(LAST_PAGE_NUMBER);
    var urls = new Set();

    for (var i = 0; i<pageNumbers.length; i++) {
        pageNumber = i + 1;
        var pageUrl = BASE_URL + pageNumber;
        urls.add(pageUrl)
    }

    urls = [...urls];
    var jsonOut = JSON.stringify(urls, null, 2);
        fs.writeFileSync(URLS_FILE, jsonOut);

   /* async.mapLimit(urls, 3, getDoctorUrlsHelper, function(err, result) {
        if (err) {
            return console.log(err);
        }

        result = flatten(result);
        
        var jsonOut = JSON.stringify(result, null, 2);
        fs.writeFileSync('./urls_raw.json', jsonOut);
    });*/
}

function getDoctorInfoHelper(url, cb) {
    console.log(url);
    cheeriolize(makeParams(url, 'GET'), function(err, $) {

        if (err) {
            console.log('err for ', url);
            delete $;
            return getDoctorInfoHelper(url, cb);
        }   
        //var names = new Array();
        
        $('.plb b').each(function(i, elem) {
            name_b = $(elem).text();
        });

        $('.plb').each(function(i, elem) {
            //$(elem).find('\n').replaceWith('')
            address_b = $(elem).text();
            //addresses.push(address)
        });
       

        $('.plw b').each(function(i, elem) {
            name_w = $(elem).text();
        });

        $('.plw').each(function(i, elem) {
            //$(elem).find('\n').replaceWith('')
            address_w = $(elem).text();
        });
/*
        $('.metrics-title a[href^="/topsites/countries/"]').each(function(i, elem) {
            country = $(elem).text();

        });

*/
        //names = [...names];
        delete $;
        return cb(null, {name_b: name_b, address_b: address_b, name_w: name_w, address_w: address_w});
    });    
}

function getDoctorInfo() {
    var doctorUrls = JSON.parse(fs.readFileSync(URLS_FILE));
    //doctorUrls = doctorUrls.slice(0, 1);
    //var doctorUrls = ['https://www.alexa.com/siteinfo/n49.com']


    async.mapLimit(doctorUrls, 10, getDoctorInfoHelper.bind(getDoctorInfoHelper), function(err, result) {
        if (err) {
            return console.log(err);
        }
        console.log('flattening...');
        result = flatten(result);
        
        console.log('stringifying...');
        var jsonOut = JSON.stringify(result, null, 2);
        console.log('writing out...');
        fs.writeFileSync(OUT_FILE, jsonOut);
    });
}

//getDoctorUrls();
getDoctorInfo();