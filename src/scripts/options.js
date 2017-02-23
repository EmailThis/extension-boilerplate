import ext from "./utils/ext";
import storage from "./utils/storage";

var colorSelectors = document.querySelectorAll(".js-radio");

var setColor = (color) => {
  document.body.style.backgroundColor = color;
};

storage.get('color', function(resp) {
  var color = resp.color;
  var option;
  if(color) {
    option = document.querySelector(`.js-radio.${color}`);
    setColor(color);
  } else {
    option = colorSelectors[0]
  }

  option.setAttribute("checked", "checked");
});

colorSelectors.forEach(function(el) {
  el.addEventListener("click", function(e) {
    var value = this.value;
    storage.set({ color: value }, function() {
      setColor(value);
    });
  })
})