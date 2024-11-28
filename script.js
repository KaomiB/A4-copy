document.body.insertAdjacentHTML('afterbegin', '<div id="theme-toggle"></div>');
const themeToggle = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Set initial theme
const currentTheme = localStorage.getItem('theme') || 
    (prefersDarkScheme.matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'dark' ? '⏾' : '';

themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' 
        ? 'light' 
        : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '⏾' : '';
    localStorage.setItem('theme', newTheme);
});

// Task storage
const tasks = {};
let currentEditTask = null;
let currentDeleteTask = null;

// DOM Elements
const newTaskBtn = document.getElementById('newTaskBtn');
const newTaskModal = document.getElementById('newTaskModal');
const confirmationModal = document.getElementById('confirmationModal');
const modalTitle = document.getElementById('modalTitle');
const addTaskBtn = document.getElementById('addTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const taskListContainer = document.getElementById('taskListContainer');
const calendar = document.getElementById('calendar');
const calendarMonth = document.getElementById('calendarMonth');


// Format date for display
function formatDate(dateString) {
    if (!dateString || dateString === 'unscheduled') return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function renderTaskList() {
    taskListContainer.innerHTML = '';
    
    // Get all tasks and sort by due date
    const allTasks = [];
    for (const date in tasks) {
        tasks[date].forEach(task => {
            allTasks.push({...task, dueDate: date});
        });
    }
    
    // Sort tasks: unscheduled at the top, then by date
    allTasks.sort((a, b) => {
        if (a.dueDate === 'unscheduled') return -1;
        if (b.dueDate === 'unscheduled') return 1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    allTasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');

        // Create tags HTML inside the template
        const tagsHtml = task.tags && task.tags.length > 0 
            ? `<div class="task-tags">
                ${task.tags.map(tag => `
                    <span class="tag" style="background-color: ${task.tagColors[tag]}">
                        ${tag}
                    </span>
                `).join('')}
               </div>`
            : '';
            taskElement.innerHTML = `
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title collapsible ${task.completed ? 'completed' : ''}">${task.title}</span>
            </div>
            <div class="task-content">
                <div class="task-description">${task.description || ''}</div>
                ${tagsHtml}
                <div class="task-meta">
                    ${task.dueDate !== 'unscheduled' ? `<div>Due: ${task.dueDate}</div>` : ''}
                    <div>
                        ${task.estimatedTime !== 'none' ? `<span>Time: ${task.estimatedTime}</span> • ` : ''}
                        ${task.energyLevel !== 'none' ? `<span>Energy: ${task.energyLevel}</span> • ` : ''}
                        ${task.importance !== 'none' ? `<span>Importance: ${task.importance}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <span class="edit-btn" data-index="${index}"></span>
                <span class="delete-btn" data-index="${index}"> 🗑 </span>
            </div>
        `;
        taskListContainer.appendChild(taskElement);

        // Add checkbox event listener
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('change', (e) => {
            task.completed = e.target.checked;
            taskElement.querySelector('.task-title').classList.toggle('completed');
            // Save updated tasks
            localStorage.setItem('tasks', JSON.stringify(tasks));
        });

        // Add collapsible description event listener
        const taskTitle = taskElement.querySelector('.task-title.collapsible');
        taskTitle.addEventListener('click', () => {
            const description = taskElement.querySelector('.task-description');
            const isCollapsed = description.style.display === 'none';
            description.style.display = isCollapsed ? 'block' : 'none';
            taskTitle.classList.toggle('collapsed', !isCollapsed);
        });

        // Event listeners for edit and delete remain the same
        taskListContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                editTask(Number(index));
            });
        });

        taskListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                showDeleteConfirmation(Number(index));
            });
        });
    });
}

    
        



// Handle task modal actions
addTaskBtn.addEventListener('click', () => {
    const taskTitle = document.getElementById('taskTitle').value;
    const taskDescription = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('dueDate').value || 'unscheduled';
    const estimatedTime = document.getElementById('estimatedTime').value;
    const energyLevel = document.getElementById('energyLevel').value;
    const importance = document.getElementById('importance').value;

    if (taskTitle) {  // If task has a title
        const newTask = {
            title: taskTitle,
            description: taskDescription,
            estimatedTime,
            energyLevel,
            importance,
            tags: Array.from(selectedTags),  // Convert Set to Array
            tagColors: Object.fromEntries(    // Store colors for each tag
                Array.from(selectedTags).map(tag => [tag, existingTags[tag]])
            ),
            completed: false  // Add completed property
        };

        if (currentEditTask) {
            // Remove old task
            const oldDate = currentEditTask.task.dueDate;
            tasks[oldDate] = tasks[oldDate].filter(t => 
                t.title !== currentEditTask.task.title || 
                t.description !== currentEditTask.task.description
            );
            
            if (tasks[oldDate].length === 0 && oldDate !== 'unscheduled') {
                delete tasks[oldDate];
            }
        }

        // Add task to appropriate list
        if (!tasks[dueDate]) {
            tasks[dueDate] = [];
        }
        tasks[dueDate].push(newTask);

        newTaskModal.style.display = 'none';
        currentEditTask = null;
        selectedTags.clear();
        renderTags();
        
        // Update displays
        renderTaskList();
        renderCalendar();
    }
});




// Edit task
function editTask(index) {
    const allTasks = [];
    for (const date in tasks) {
        tasks[date].forEach(task => {
            allTasks.push({...task, dueDate: date});
        });
    }
    
    const task = allTasks[index];

    // Populate modal with task details
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('estimatedTime').value = task.estimatedTime;
    document.getElementById('energyLevel').value = task.energyLevel;
    document.getElementById('importance').value = task.importance;
    

  // Load tags
  selectedTags = new Set(task.tags || []);
  if (task.tagColors) {
      Object.assign(existingTags, task.tagColors);
  }
  renderTags();

    // Store current edit task for later reference
    currentEditTask = { index, task };
    modalTitle.textContent = 'Edit Task';
    newTaskModal.style.display = 'block';
}

// Show delete confirmation
function showDeleteConfirmation(index) {
    const allTasks = [];
    for (const date in tasks) {
        tasks[date].forEach(task => {
            allTasks.push({...task, dueDate: date});
        });
    }
    
    currentDeleteTask = { index, task: allTasks[index] };
    confirmationModal.style.display = 'block';
}

// Delete task
function deleteTask() {
    if (!currentDeleteTask) return;

    const taskToDelete = currentDeleteTask.task;
    
    if (tasks[taskToDelete.dueDate]) {
        tasks[taskToDelete.dueDate] = tasks[taskToDelete.dueDate].filter(t => 
            t.title !== taskToDelete.title || 
            t.description !== taskToDelete.description
        );
        
        if (tasks[taskToDelete.dueDate].length === 0) {
            delete tasks[taskToDelete.dueDate];
        }
    }

    confirmationModal.style.display = 'none';
    currentDeleteTask = null;
    renderTaskList();
    renderCalendar();
}



// Tag management
let existingTags = {}; // Store tags and their colors
let selectedTags = new Set(); // Currently selected tags
let newTagColor = '#74b9ff'; // Default color for new tags

const tagInput = document.getElementById('tagInput');
const tagDisplay = document.getElementById('tagDisplay');
const tagSuggestions = document.getElementById('tagSuggestions');
const tagColorPicker = document.getElementById('tagColorPicker');

// Initialize with some sample tags
existingTags = {
    'Personal': '#ff7675',
    'Work': '#74b9ff',
    'School': '#fd79a8'
};

function createTagElement(tagText, color) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.style.backgroundColor = color;
    tag.style.color = isLightColor(color) ? '#2d3436' : 'white';
    
    tag.innerHTML = `
        ${tagText}
        <span class="remove-tag" data-tag="${tagText}">×</span>
    `;
    
    tag.querySelector('.remove-tag').addEventListener('click', (e) => {
        e.stopPropagation();
        selectedTags.delete(tagText);
        renderTags();
    });
    
    return tag;
}

function renderTags() {
    tagDisplay.innerHTML = '';
    selectedTags.forEach(tag => {
        tagDisplay.appendChild(createTagElement(tag, existingTags[tag]));
    });
}


function showTagSuggestions(input) {
    const value = input.toLowerCase();
    const suggestions = Object.keys(existingTags)
        .filter(tag => tag.toLowerCase().includes(value) && !selectedTags.has(tag));
    
    if (suggestions.length === 0 && value.length > 0) {
        tagSuggestions.innerHTML = `
            <div class="tag-suggestion" data-tag="${value}">
                Create new tag "${value}"...
            </div>
        `;
        tagColorPicker.style.display = 'block';
    } else {
        tagColorPicker.style.display = 'none';
        tagSuggestions.innerHTML = suggestions
            .map(tag => `
                <div class="tag-suggestion" data-tag="${tag}">
                    <span class="color-preview" style="background-color: ${existingTags[tag]}"></span>
                    ${tag}
                </div>
            `)
            .join('');
    }
    
    tagSuggestions.style.display = suggestions.length || value.length > 0 ? 'block' : 'none';
}

// Color picker functionality
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelector('.color-option.selected')?.classList.remove('selected');
        option.classList.add('selected');
        newTagColor = option.dataset.color;
    });
});

// Helper function to determine if a color is light
function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
}



// Render calendar
let currentDate = new Date();

// Calendar display only for tasks with dates
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarMonth.textContent = new Date(year, month).toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
    });

    calendar.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        calendar.appendChild(emptyCell);
    }

    // Add days of the month
    for (let day = 1; day <= lastDay; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        dayCell.style.cursor = 'pointer';
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (tasks[dateStr] && tasks[dateStr].length > 0) {
            dayCell.classList.add('has-tasks');
        }

        dayCell.addEventListener('click', () => {
            currentEditTask = null;
            modalTitle.textContent = 'Create New Task';
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('dueDate').value = dateStr;
            document.getElementById('estimatedTime').value = 'none';
            document.getElementById('energyLevel').value = 'none';
            document.getElementById('importance').value = 'none';
            newTaskModal.style.display = 'block';
        });

        calendar.appendChild(dayCell);
    }
}

// Event Listener for task button
newTaskBtn.addEventListener('click', () => {
    currentEditTask = null;
    modalTitle.textContent = 'Create New Task';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('estimatedTime').value = 'none';
    document.getElementById('energyLevel').value = 'none';
    document.getElementById('importance').value = 'none';
    newTaskModal.style.display = 'block';

});


// Event Listener for tag input, comma and enter key

tagInput.addEventListener('input', () => {
    showTagSuggestions(tagInput.value);
});

tagInput.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.value.trim()) {
        e.preventDefault();
        const tagText = tagInput.value.trim().replace(',', '');
        
        if (!existingTags[tagText]) {
            existingTags[tagText] = newTagColor;
        }
        
        selectedTags.add(tagText);
        tagInput.value = '';
        tagSuggestions.style.display = 'none';
        tagColorPicker.style.display = 'none';
        renderTags();
    }
});


// Event Listener for tag suggestions
tagSuggestions.addEventListener('click', (e) => {
    const suggestion = e.target.closest('.tag-suggestion');
    if (suggestion) {
        const tagText = suggestion.dataset.tag;
        if (!existingTags[tagText]) {
            existingTags[tagText] = newTagColor;
        }
        selectedTags.add(tagText);
        tagInput.value = '';
        tagSuggestions.style.display = 'none';
        tagColorPicker.style.display = 'none';
        renderTags();
    }
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.tag-input-container')) {
        tagSuggestions.style.display = 'none';
        tagColorPicker.style.display = 'none';
    }
});


cancelTaskBtn.addEventListener('click', () => {
    newTaskModal.style.display = 'none';
    currentEditTask = null;
});

// Handle delete confirmation modal actions
confirmDeleteBtn.addEventListener('click', deleteTask);
cancelDeleteBtn.addEventListener('click', () => {
    confirmationModal.style.display = 'none';
    currentDeleteTask = null;
});

// Calendar navigation
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Initial render
renderCalendar();
renderTaskList();