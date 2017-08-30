import storage from './utils/storage';

const colorSelectors = document.querySelectorAll('.js-radio');

const setColor = color => {
  document.body.style.backgroundColor = color;
};

storage.get('color', resp => {
  let color = resp.color;
  let option;

  if (color) {
    option = document.querySelector(`.js-radio.${color}`);
    setColor(color);
  } else {
    option = colorSelectors[0];
  }

  option.setAttribute('checked', 'checked');
});

colorSelectors.forEach(el => {
  el.addEventListener('click', function (e) {
    let value = this.value;
    storage.set({color: value}, function () {
      setColor(value);
    });
  });
});

const clientSecret = document.getElementById('client-secret');

storage.get('troovySecret', resp => {
  if (resp.troovySecret) {
    clientSecret.value = resp.troovySecret;
  }
});

clientSecret.addEventListener('keyup', (event) => {
  storage.set({troovySecret: event.target.value}, () => {
    console.log('stored');
  });
});

// document.getElementById('save-options').addEventListener('click', (event) => {
//   event.preventDefault();
//
//   console.log(clientSecret.value);
// });
