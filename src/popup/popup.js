// Get the groups list element
const groupsList = document.getElementById('groupsList');

// Simulate loading groups (replace with actual data later)
setTimeout(() => {
  groupsList.innerHTML = `
    <li>Work Themes</li>
    <li class="active">Personal Themes</li>
  `;
  
  // Add click handlers to each group
  groupsList.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      // Remove active from all
      groupsList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      // Add active to clicked item
      item.classList.add('active');
    });
  });
}, 500);