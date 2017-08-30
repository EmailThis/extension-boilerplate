export const main = data => {
  // let description = data.description; // Holds unescaped description.
  // data.description = data.description.replace(/'/g, "\'");
  // console.log(data);
  let json = JSON.stringify(data);

  return `
    <form name="save-page" id="formSavePage">
      <div class="site-description">
            <input id="bookmark-url" type="hidden" name="url" value="${data.url}">
            <input id="bookmark-title" type="hidden" name="title" value="${data.title}">
            <textarea id="bookmark-description" class="description" name="description">${data.description}</textarea>
      </div>
      <div class="action-container">
        <button id="save-btn" class="btn btn-primary">Save</button>
      </div>
    </form>
  `;
};

export const login = () => {
  return `
    <div>
      <form id="troovyLoginForm" name="troovyLoginForm">
          <label>Email</label>
          <div class="form-group" style="margin-bottom: 15px">
              <input type="text" name="username" id="username" value="" placeholder="email"/>
          </div>
          <label>Password</label>
          <div class="form-group" style="margin-bottom: 15px">
              <input type="password" name="password" value="" placeholder="password"/>
          </div>
          <button class="btn btn-primary" id="btn-login" type="submit" style="margin-bottom: 15px">Login</button>
      </form>
    </div>
  `;
};

export const categorySelect = t => {
  let formHTML = '';

  for (let i = 0, len = t.length; i < len; i++) {
    formHTML += '<option value="' + t[i]['id'] + '">' + t[i]['name'] + '</option>';
  }

  // @ToDo: Move this into the templates module.
  return `
    <form name="categories">
        <!--<label>Category</label>-->
        <select name="category" id="cat-select">
        ${formHTML}
        </select>
    </form>
  `;
};

// @ToDo: Figure out what this is & if it is needed.
export const og = data => {
  let json = JSON.stringify(data);

  return `
    <div class="site-description">
      <h3 class="title">${data.title}</h3>
      <p class="description">${data.description}</p>
      <a href="${data.url}" target="_blank" class="url">${data.url}</a>
    </div>
    <div class="action-container">
      <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Save</button>
    </div>
  `;
};
