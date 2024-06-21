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
    if (!subjectName) {
        subjectName = prompt('Enter subject name:');
    }
    if (subjectName) {
        
        subjects[subjectName] = {};
        createTab(subjectName);
        createSubjectContent(subjectName);
        saveToLocalStorage();
        updateSummary();
    }
}

function createTab(subjectName) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerText = subjectName;
    tab.onclick = () => showTab(subjectName);
    tab.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm(`Delete the tab and all its data for ${subjectName}?`)) {
            deleteSubject(subjectName, tab);
        }
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
            <label for="goalGrade_${subjectName}">Goal Grade (%)</label>
            <input type="number" id="goalGrade_${subjectName}" placeholder="Enter your goal grade" oninput="delayedSave()">
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
    showTab('summary');
}


function showTab(id) {
    // Hide all tab contents and remove the active class from all tabs
    document.querySelectorAll('.tab-content').forEach(tabContent => tabContent.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Show the selected tab content
    document.getElementById(id).classList.remove('hidden');

    // Find the tab element corresponding to the selected tab content and add the active class
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab-id') === id) {
            tab.classList.add('active');
        }
    });

    // Update the summary if the summary tab is selected
    if (id === 'summary') {
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

function updateSummary() {
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
        ]
    });
}

window.onload = () => {
    loadFromLocalStorage();
    showTab('summary');
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
