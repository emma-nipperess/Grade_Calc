let subjects = {};
let saveTimeout;
let calculationTimeout;

function delayedSave(subjectName=null) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToLocalStorage, 1000);
    
    if (subjectName != null) {
        clearTimeout(calculationTimeout);
        console.log(subjectName);
        calculationTimeout = setTimeout(() => calculateNeededGrades(subjectName), 1000);
    }
    
}

function addNewSubject(subjectName = null) {
    if (subjectName) {
        
        subjects[subjectName] = {};
        createTab(subjectName);
        createSubjectContent(subjectName);
        saveToLocalStorage();
        showTab(subjectName);
    }
}

function createTab(subjectName) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerText = subjectName;
    tab.onclick = () => showTab(subjectName);
    tab.oncontextmenu = (e) => {
        e.preventDefault();
        openDeleteModal(subjectName, deleteSubject, subjectName, tab);
    };
    document.getElementById('tabs').insertBefore(tab, document.getElementById('tabs').lastChild);
}

function createSubjectContent(subjectName) {
    const content = document.createElement('div');
    content.id = subjectName;
    content.className = 'tab-content hidden';
    content.innerHTML = `
        <h2>${subjectName}</h2>
        <div class="input-group">
            <label for="goalGrade_${subjectName}"  >Goal Grade (%)</label>
            <input type="number" id="goalGrade_${subjectName}" placeholder="Enter your goal grade" oninput="delayedSave(subjectName='${subjectName}')">
        </div>
        <div id="assessments_${subjectName}">
            <h3>Assessments</h3>
        </div>
        <div class="input-group">
            <button onclick="addAssessmentItem('${subjectName}')">Add Assessment Item</button>
        </div>
       
        <div class="results" id="results_${subjectName}"></div>
    `;
    document.querySelector('.container').appendChild(content);
}

function addAssessmentItem(subjectName) {
    const assessmentId = `assessment_${document.querySelectorAll(`#${subjectName} .assessment-item`).length}`;
    const assessmentDiv = document.createElement('div');
    assessmentDiv.className = 'assessment-item';
    console.log(subjectName);
    assessmentDiv.innerHTML = `
        <input type="number" id="${subjectName}_${assessmentId}_weight" placeholder="Weight (%)" oninput="delayedSave(subjectName='${subjectName}')">
        <input type="number" id="${subjectName}_${assessmentId}_grade" placeholder="Achieved (%)" oninput="delayedSave(subjectName='${subjectName}')">
        <button onclick="deleteAssessmentItem('${subjectName}', '${assessmentId}')">Delete</button>
    `;
    console.log(assessmentDiv);
    document.getElementById(`assessments_${subjectName}`).appendChild(assessmentDiv);
}

function deleteAssessmentItem(subjectName, assessmentId) {
    const assessmentDiv = document.querySelector(`#${subjectName} .assessment-item button[onclick="deleteAssessmentItem('${subjectName}', '${assessmentId}')"]`).parentElement;
    assessmentDiv.remove();
    delayedSave(subjectName=subjectName);
}

function deleteSubject(subjectName, tab) {
    const content = document.getElementById(subjectName);

    if (tab) {
        tab.remove();
    }
    if (content) {
        content.remove();
    }

    // Remove the subject from the subjects dictionary
    if (subjects.hasOwnProperty(subjectName)) {
        delete subjects[subjectName];
    }
    
    saveToLocalStorage();
    showTab('Summary');
}

function showTab(id) {
    console.log("Attemping to show the tab for: " + id);
    // Hide all tab contents and remove the active class from all tabs
    document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Show the selected tab content with a transition
    setTimeout(() => {
        document.getElementById(id).classList.remove('hidden');
        document.getElementById(id).classList.add('fade-in');
    }, 10);

    // Add the active class to the selected tab
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.innerText === id) {
            tab.classList.add('active');
        }
    });

    // Update the summary if the summary tab is selected
    if (id === 'Summary') {
        updateSummary();
    }
}


function calculateNeededGrades(subjectName) {
    console.log(subjectName);
    
    console.log("ca");
    const goalGrade = parseFloat(document.getElementById(`goalGrade_${subjectName}`).value);
    const assessmentItems = document.querySelectorAll(`#${subjectName} .assessment-item`);
    let totalWeight = 0;
    let currentGrade = 0;
    let unmarkedWeight = 0;

    assessmentItems.forEach(item => {
        const weight = parseFloat(item.children[0].value) || 0;
        const grade = parseFloat(item.children[1].value);

        if (isNaN(grade)) {
            unmarkedWeight += weight;
        } else {
            totalWeight += weight;
            currentGrade += (grade * weight) / 100;
        }
    });

    const remainingWeight = 100 - totalWeight;

    if (remainingWeight < 0) {
        document.getElementById(`results_${subjectName}`).innerText = 'Total weight exceeds 100%. Please adjust the weights.';
        return;
    }

    const neededGrade = ((goalGrade - currentGrade) / (remainingWeight / 100)).toFixed(2);

    document.querySelectorAll(`#${subjectName} .assessment-item`).forEach(item => {
        if (!item.children[1].value) {
            item.children[1].placeholder = `Need ${neededGrade}%`;
        }
    });

    document.getElementById(`results_${subjectName}`).innerText = `To achieve a ${goalGrade}% overall, you need to score at least ${neededGrade}% on the remaining assessments.`;
}


function calculateNeededGrade(goalGrade, currentGrade, totalWeight) {
    const remainingWeight = 100 - totalWeight;
    if (remainingWeight <= 0) return 'N/A';
    const neededGrade = ((goalGrade - currentGrade) / (remainingWeight / 100)).toFixed(2);
    return neededGrade > 0 ? neededGrade : 0;
}

function getColorForGrade(currentGrade, goalGrade, neededGrade) {
    if (neededGrade === 'N/A' || neededGrade > 100) {
        // If the needed grade is above 100% or not applicable, mark as red
        return `rgb(255, 0, 0)`;
    }

    // Calculate the difference between current grade and goal grade
    const gradeDifference = currentGrade - goalGrade;

    // If the current grade is well above the goal, mark as green
    if (gradeDifference >= 10) { // You can adjust the threshold for "well above"
        return `rgb(0, 255, 0)`;
    }

    // Calculate the percentage of the goal achieved
    let percentage = ranking(neededGrade, currentGrade) * 100;
    console.log("current grade: " + currentGrade + "goalGrade: " + goalGrade);

    // Calculate the RGB values for the gradient
    let red, green;
    if (percentage < 90) {
        // Transition from red to yellow
        red = 255;
        green = Math.round(10 * percentage);
        console.log("colour for red to yellow is green: " + green + "with percentage: " + percentage)
    } else {
        // Transition from yellow to green
        green = 255;
        red = Math.round(510 - 5.1 * percentage);
        console.log("colour for yellow to green is red: " + red + "with percentage: " + percentage)
    }

    return `rgb(${red},${green},0)`;
}


function ranking(neededGrade, currentGrade) {
    return (Math.max(0, ((neededGrade - currentGrade)) / currentGrade));
}

let summaryChartInstance = null;

function updateSummary() {
    const summaryContent = document.getElementById('summaryContent');
    const emptyState = document.getElementById('emptyState');

    if (Object.keys(subjects).length === 0) {
        summaryContent.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    } else {
        summaryContent.style.display = 'block';
        emptyState.style.display = 'none';
    }

    const summaryData = Object.keys(subjects).map(subjectName => {
        const subjectData = subjects[subjectName];
        const goalGrade = parseFloat(document.getElementById(`goalGrade_${subjectName}`)?.value) || 0;
        let currentGrade = 0;
        let totalWeight = 0;

        Array.from(document.querySelectorAll(`#${subjectName} .assessment-item`)).forEach(item => {
            const weight = parseFloat(item.children[0]?.value) || 0;
            const grade = parseFloat(item.children[1]?.value);
            if (!isNaN(grade)) {
                currentGrade += (grade * weight) / 100;
                totalWeight += weight;
            }
        });

        const neededGrade = calculateNeededGrade(goalGrade, currentGrade, totalWeight);

        return {
            subject: subjectName,
            goalGrade: goalGrade || 'N/A',
            currentGrade: totalWeight ? (currentGrade / totalWeight * 100).toFixed(2) : 'N/A',
            neededGrade: neededGrade
        };
    });

    new Tabulator("#summaryTable", {
        data: summaryData,
        layout: "fitColumns",
        columns: [
            { title: "Subject", field: "subject", sorter: "string" },
            { title: "Goal Grade", field: "goalGrade", sorter: "number" },
            { title: "Current Grade", field: "currentGrade", sorter: "number" },
            { title: "Required Grade on Future Assessments", field: "neededGrade", sorter: "number" }
        ],
        rowFormatter: function(row) {
            const data = row.getData();
            const currentGrade = parseFloat(data.currentGrade);
            const goalGrade = parseFloat(data.goalGrade);
            const neededGrade = parseFloat(data.neededGrade);

            if (!isNaN(currentGrade) && !isNaN(goalGrade) && !isNaN(neededGrade)) {
                const color = getColorForGrade(currentGrade, goalGrade, neededGrade);
                row.getElement().style.backgroundColor = color;
            }
        }
    });

    // Check if a chart instance already exists and destroy it
    if (summaryChartInstance) {
        summaryChartInstance.destroy();
    }

    const ctx = document.getElementById('summaryChart').getContext('2d');
    const chartData = {
        labels: summaryData.map(data => data.subject),
        datasets: [
            {
                label: 'Current Grade',
                data: summaryData.map(data => parseFloat(data.currentGrade)),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Goal Grade',
                data: summaryData.map(data => parseFloat(data.goalGrade)),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }
        ]
    };

    summaryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            maintainAspectRatio: true,
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

window.onload = () => {
    loadFromLocalStorage();
    showTab('Summary');
};

function saveToLocalStorage() {
    console.log("saving to local storage");
    
    Object.keys(subjects).forEach(subjectName => {
        const goalGradeInput = document.getElementById(`goalGrade_${subjectName}`);
        if (goalGradeInput) {
            subjects[subjectName].goalGrade = goalGradeInput.value;
        }
        const assessmentItems = Array.from(document.querySelectorAll(`#${subjectName} .assessment-item`)).map(item => {
            return {
                weight: item.children[0]?.value || '',
                grade: item.children[1]?.value || ''
            };
        });
        subjects[subjectName].assessments = assessmentItems;
    });
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

function loadFromLocalStorage() {
    const storedSubjects = JSON.parse(localStorage.getItem('subjects')) || {};
    subjects = storedSubjects;
    Object.keys(subjects).forEach(subjectName => {
        createTab(subjectName, subjectName);
        createSubjectContent(subjectName, subjectName);
        const goalGradeInput = document.getElementById(`goalGrade_${subjectName}`);
        if (goalGradeInput) {
            goalGradeInput.value = subjects[subjectName].goalGrade || '';
        }
        const assessments = subjects[subjectName].assessments || [];
        assessments.forEach((assessment, i) => {
            addAssessmentItem(subjectName);
            const weightInput = document.getElementById(`${subjectName}_assessment_${i}_weight`);
            const gradeInput = document.getElementById(`${subjectName}_assessment_${i}_grade`);
            if (weightInput) {
                weightInput.value = assessment.weight || '';
            }
            if (gradeInput) {
                gradeInput.value = assessment.grade || '';
            }
        });

        calculateNeededGrades(subjectName);
    });
}

// JavaScript for modal functionality
document.addEventListener('DOMContentLoaded', () => {
    /* COOKING */
    const toggleCookedButton = document.getElementById('toggleCookedButton');
    toggleCookedButton.addEventListener('click', () => {
        const cookedRating = document.getElementById('cookedRating');
        if (cookedRating.style.display === 'none' || cookedRating.style.display === '') {
            updateCookedSection();
            cookedRating.style.display = 'block';
            cookedRating.scrollIntoView({ behavior: 'smooth' });
            toggleCookedButton.textContent = 'Hide Cookedness, Please.';
        } else {
            cookedRating.style.display = 'none';
            toggleCookedButton.textContent = 'See How Cooked I Am';
        }
    });
    /* END COOKING */

    const modal = document.getElementById('addSubjectModal');
    const closeBtn = document.querySelector('.close-btn');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const newSubjectNameInput = document.getElementById('newSubjectName');
    
    // Function to open the modal
    function openModal() {
        modal.style.display = 'block';
        newSubjectNameInput.value = ''; // Clear the input field
    }
    
    // Function to close the modal
    function closeModal() {
        modal.style.display = 'none';
    }
    
    // When the user clicks on the button, open the modal
    document.querySelector('.add-subject-btn').addEventListener('click', openModal);
    
    // When the user clicks on <span> (x), close the modal
    closeBtn.addEventListener('click', closeModal);
    
    // When the user clicks anywhere outside of the modal, close it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // When the user clicks the add button in the modal
    addSubjectBtn.addEventListener('click', () => {
        const subjectName = newSubjectNameInput.value.trim();
        if (subjectName) {
            addNewSubject(subjectName);
            closeModal();
        } else {
            alert('Please enter a subject name.');
        }
    });

    // Allow ENTER key to submit the form
    newSubjectNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addSubjectBtn.click();
        }
    });

    // now for delete section
    const closeDeleteBtn = document.querySelector('#close-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    // Close delete modal
    closeDeleteBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    // Confirm delete action
    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteFunc) {
            deleteFunc(...deleteArgs);
        }
        closeDeleteModal();
    });
});


let deleteFunc = null;
let deleteArgs = [];

// Function to open the delete modal
function openDeleteModal(subjectName, func, ...args) {
    const deleteModal = document.getElementById('deleteSubjectModal');
    const deleteSubjectNameSpan = document.getElementById('deleteSubjectName');

    deleteModal.style.display = 'block';
    deleteSubjectNameSpan.textContent = subjectName;

    // Store the function and arguments
    deleteFunc = func;
    deleteArgs = args;
}

// Function to close the delete modal
function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteSubjectModal');
    deleteModal.style.display = 'none';
    deleteFunc = null;
    deleteArgs = [];
}

function getCookedColor(score) {
    const red = Math.min(255, 255 * (score / 100));
    const green = Math.min(255, 255 * ((100 - score) / 100));
    return `rgb(${red},${green},0)`;
}

function calculateCookedScore(summaryData) {
    let totalCooked = 0;
    let totalSubjects = summaryData.length;

    summaryData.forEach(data => {
        const currentGrade = parseFloat(data.currentGrade);
        const goalGrade = parseFloat(data.goalGrade);
        const neededGrade = parseFloat(data.neededGrade);

        if (!isNaN(currentGrade) && !isNaN(goalGrade) && !isNaN(neededGrade)) {
            if (neededGrade > 100) {
                totalCooked += 1; // Fully cooked if needed grade is above 100%
            } else {
                // Partially cooked based on how close neededGrade is to 100%
                totalCooked += ranking(neededGrade, currentGrade) * 5;
                console.log(totalCooked);
            }
        }
    });

    // Calculate the cooked score as a percentage
    let cookedScore = (totalCooked / totalSubjects) * 100;

    // Cap the score at 100
    cookedScore = Math.min(cookedScore, 100);

    return cookedScore.toFixed(2);
}


function updateCookedSection() {
    const cookedScoreDiv = document.getElementById('cookedScore');
    const memeDiv = document.getElementById('memeDiv');
    
    const summaryData = Object.keys(subjects).map(subjectName => {
        const subjectData = subjects[subjectName];
        const goalGrade = parseFloat(document.getElementById(`goalGrade_${subjectName}`)?.value) || 0;
        let currentGrade = 0;
        let totalWeight = 0;

        Array.from(document.querySelectorAll(`#${subjectName} .assessment-item`)).forEach(item => {
            const weight = parseFloat(item.children[0]?.value) || 0;
            const grade = parseFloat(item.children[1]?.value);
            if (!isNaN(grade)) {
                currentGrade += (grade * weight) / 100;
                totalWeight += weight;
            }
        });

        const neededGrade = calculateNeededGrade(goalGrade, currentGrade, totalWeight);

        return {
            subject: subjectName,
            goalGrade: goalGrade || 'N/A',
            currentGrade: totalWeight ? (currentGrade / totalWeight * 100).toFixed(2) : 'N/A',
            neededGrade: neededGrade
        };
    });

    const cookedScore = calculateCookedScore(summaryData);
    cookedScoreDiv.textContent = `${cookedScore}% COOKED`;
    cookedScoreDiv.style.color = getCookedColor(cookedScore);

    // Show or hide the meme based on the cooked score
    if (cookedScore > 80) {
        memeDiv.style.display = 'block';
    } else {
        memeDiv.style.display = 'none';
    }
}