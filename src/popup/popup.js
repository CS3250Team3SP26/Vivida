// Get the groups list element
const groupsList = document.getElementById('groupsList');

//Replaced with actual data

  async function loadGroups() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_ALL_GROUPS' });
      if (response.success) {
          groupsList.innerHTML = ''; // clear the loading text
          for (const group of response.data) {
              const li = document.createElement('li');
              li.textContent = group.name;
              li.dataset.groupId = group.id;

              
              li.addEventListener('click', async () => {
                // Update the UI
                groupsList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                
                // Tell the background this group is now active
                await browser.runtime.sendMessage({ type: 'SET_ACTIVE_GROUP', groupId: group.id });
                
                // Enable each theme in the group
                for (const themeId of group.themeIds) {
                    await browser.runtime.sendMessage({ type: 'ENABLE_THEME', themeId: themeId });
                }
            });
              groupsList.appendChild(li);
      }
      } else {
      groupsList.innerHTML = '<li class = "loading">Failed to load gropups</li>';
      }
    } catch (_error) {
      groupsList.innerHTML = '<li class = "loading">Failed to load groups</li>';
    }
  }
  
  loadGroups();

  const newGroupBtn = document.getElementById('newGroupBtn');
  
  newGroupBtn.addEventListener('click', async () => {
      // your code here
      const name = prompt('Enter a group name');
      if(name){
        const id = 'group-' + Date.now() + '-' + Math.floor(Math.random() *1000);
        await browser.runtime.sendMessage({type: 'SAVE_GROUP', groupId: id, themes: [] });
        alert(`Group "${name}" created!`)
        loadGroups();
      }
  });
  const settingsBtn = document.getElementById('settingsBtn');
settingsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
});
/**The settings button calls browser.runtime.openOptionsPage() 
— so person working on options need to define an options 
page in manifest.json using 
the options_ui field, like: 
 "options_ui": {
    "page": "options/options.html"
  }
  options page should be at src/options/options.html
  **/