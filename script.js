// Inside script.js

document.addEventListener('DOMContentLoaded', function() {
    const categoryList = document.getElementById('category-list');
    const addCategoryButton = document.getElementById('add-category');
    const newCategoryInput = document.getElementById('new-category');
  
    // Function to add category to the list
    function addCategory(categoryName) {
      const listItem = document.createElement('li');
      listItem.textContent = categoryName;
  
      // delete button for each category
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', function() {
        listItem.remove();
      });
  
      listItem.appendChild(deleteButton);
      categoryList.appendChild(listItem);
    }
  
    //Event listener f "Add Category" button
    addCategoryButton.addEventListener('click', function() {
      const newCategoryName = newCategoryInput.value.trim();
      if (newCategoryName !== '') {
        addCategory(newCategoryName);
        newCategoryInput.value = '';
      }
    });
  
    // Pre-populate example categories
    const exampleCategories = ['Food', 'Entertainment'];
    exampleCategories.forEach(function(category) {
      addCategory(category);
    });
  });
  