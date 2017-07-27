/**
 * Created by donambridge on 2017-04-05.
 */

//document.addEventListener('DOMContentLoaded', checkUserLoggedIn, false);

/**
 * Ajax helper function
 */
privates = {};
privates.createCORSRequest = function (method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
};

// function checkUserLoggedIn() {
//     var self = this;
//     var hashedUrl = encodeURIComponent(location.protocol + "//" + location.host);
//     var xhr = privates.createCORSRequest('GET', config.baseUrl + '/bookmarklet/user/?origin='+hashedUrl);
//     xhr.onload = function () {
//         if (xhr.status === 200) {
//             alert('logged in');
//             self.fetchCategories();
//             self.showEditContainer();
//         } else {
//             elements.errorLogin.innerHTML = 'Please login to bookmarmk this page.';
//             self.showLoginContainer();
//         }
//     };
//     xhr.onerror = function () {
//         elements.formLogin.style.display = 'block';
//     };
//     xhr.withCredentials = true;
//     xhr.send();
// }