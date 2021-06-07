(function () {
  const popup_content = document.getElementById("popup-content");
  const error_content = document.getElementById("error-content");
  const error_message = document.getElementById("error_message");

  // Buttons
  const save      = document.getElementById("save");
  const save_all  = document.getElementById("save_all");
  const clear_all = document.getElementById("clear_all");
  const open_all  = document.getElementById("open_all");

  // Form
  const input_save = document.getElementById('input_save');
  const input_txt  = document.getElementById('input_txt');

  // Message modal
  const message_modal = document.getElementById("message_modal");

  // List
  const ol = document.getElementById("links_olist");

  // Counter
  const count = document.getElementById('count');

  // URL - Store the current links; To find out duplicate entries.
  const urls = [];

  // Colors
  const green = "#53af80";
  const red   = "#dc3545";

  // Local storage name
  const storage_name = "openUR";

  /**
   * Display the popup's error message, and hide the normal UI.
   */
  const displayError = (error) => {
    popup_content.classList.add("hidden");
    error_content.classList.remove("hidden");
    error_message.textContent = `${error.message}😭`;
    console.error(error.message);
  };

  /**
   * Helper functions
   */
  const check_storage = () => {
    return (typeof Storage === undefined) ? false : true;
  }
  const scroll_list = () => {
    // const li = document.querySelectorAll('links_olist_li');
    // const last_li = li[li.length - 1];
    // last_li.scrollIntoView();
  }

  const set_url_to_list = (url, scroll_list) => {
    const domain = url
      .replace("http://", "")
      .replace("https://", "")
      .replace("www.", "")
      .split(/[/?#]/)[0];

    // Create html elements
    const li = document.createElement("li");
    const span = document.createElement("span");
    const a = document.createElement("a");

    // Add contents to created html elements
    span.textContent = domain;
    a.href = url;
    a.textContent += url;
    a.className = "links";
    li.className = 'links_olist_li';

    li.appendChild(span);
    li.appendChild(a);
    ol.appendChild(li);

    if(urls.length && urls.length > 2){
      return scroll_list();
    }
  };

  // Save the url to storage and also update the list.
  const save_to_local_storage = (url) => {
    urls.push(url);
    count.textContent = urls.length;
    localStorage.setItem(storage_name, JSON.stringify(urls));
    set_url_to_list(url, scroll_list);
  };

  // Display the current action. Eg: saved, opened, errors etc.
  const display_message = (msg, color) => {
    message_modal.style.color = color;
    message_modal.textContent = msg;
    message_modal.style.visibility = "visible";
    setTimeout(() => {
      message_modal.style.visibility = "hidden";
    }, 5000);
  };

  // Check if the url is already present in the 'urls' array;
  const duplicate_url = (url) => {
    return urls.indexOf(url) > -1 ? true : false;
  };

  // Get links from local storage if any
  const get_links_from_storage = () => {
    urls.splice(0, urls.length);
    if (localStorage.getItem(storage_name) != null) {
      let urls_from_storage = JSON.parse(localStorage.getItem(storage_name));
      urls_from_storage.forEach((url) => {
        set_url_to_list(url, scroll_list);
        urls.push(url);
        count.textContent = urls.length;
      });
      display_message("Loaded links from storage!", green);
    } else {
      display_message("No stored links in the storage!", green);
    }
  };

  // Check if the url is valid or not
  const check_for_valid_url = (url) => {
    return url.match(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    )
      ? true
      : false;
  }

  /**
   * Listen for events
   */

  // Save the current webpage's link to localstorage and display it on list.
  save.addEventListener("click", () => {
    browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0].url;
      if (!duplicate_url(url)) {
        save_to_local_storage(tabs[0].url);
        display_message("Saved!", green);
      } else {
        display_message("Link is already saved!", red);
      }
    });
  });

  // Clear all saved items from storage and from the list
  clear_all.addEventListener('click', () => {
    localStorage.clear();
    while(ol.firstChild){
      ol.removeChild(ol.firstChild);
    }
    urls.splice(0, urls.length);
    count.textContent = '0';
    display_message("All saved links are cleared.", green);
  });

  // Form submit event - Save link which is inputed through input text box
  input_save.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input_txt.value;

    if(check_storage){
      if(url){
        if(!check_for_valid_url(url)){
          display_message("Enter a valid link.", red);
        }else if(duplicate_url(url)){
          display_message("Link is already saved!", red);
        } else{
          save_to_local_storage(url);
          display_message("Saved!", green);
        }
        input_txt.value = '';
      }else{
        display_message("Type in a link and hit enter!", green);
      }
    }else{
      display_message("Not able to save. Storage not accessable.", red); 
    }
  });

  // Open all the links in new tabs.
  open_all.addEventListener('click', () => {
    if(typeof urls !== undefined && urls.length > 0){
      urls.forEach(url => browser.tabs.create({ url: url }));
      display_message("Opened link(s) in new tab.", green);
    }else{
      display_message('There is no links to open!', red);
    }
  });

  // Save all open tabs in localstorage and display it in the list
  save_all.addEventListener('click', () => {
    browser.tabs.query({}).then(tabs => {
      for(let tab of tabs){
        if(!check_for_valid_url(tab.url)){
          display_message("Invalid link.", red);
        }else if(duplicate_url(tab.url)){
          display_message("Skipped duplicate links", red);
        } else{
          save_to_local_storage(tab.url);
        }
      }
      display_message("Saved!", green);
    }).catch(e => {
      console.error(e)
      display_message(e, red);
    });
  });
  // Init
  get_links_from_storage();
})();
