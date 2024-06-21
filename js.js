let subjects = [];
let saveTimeout;
let calculationTimeout;

function delayedSave(subjectId=null) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToLocalStorage, 1000);
    
    if (subjectId != null) {
        clearTimeout(calculationTimeout);
        console.log(subjectId);
        calculationTimeout = setTimeout(() => calculateNeededGrades(subjectId), 1000);
    }
    
}

function addNewSubject(subjectName = null) {
    if (!subjectName) {
        subjectName = prompt('Enter subject name:');
    }
    if (subjectName) {
        const subjectId = `subject_${subjects.length}`;
        subjects.push(subjectName);
        createTab(subjectName, subjectId);
        createSubjectContent(subjectName, subjectId);
        saveToLocalStorage();
        updateSummary();
    }
}

function createTab(subjectName, subjectId) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerText = subjectName;
    tab.onclick = () => showTab(subjectId);
    tab.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm(`Delete the tab and all its data for ${subjectName}?`)) {
            deleteSubject(subjectId, tab);
        }
    };
    document.getElementById('tabs').insertBefore(tab, document.getElementById('tabs').lastChild);
}

function createSubjectContent(subjectName, subjectId) {
    const content = document.createElement('div');
    content.id = subjectId;
    content.className = 'tab-content hidden';
    content.innerHTML = `
        <h2>${subjectName}</h2>
        <div class="input-group">
            <label for="goalGrade_${subjectId}">Goal Grade (%)</label>
            <input type="number" id="goalGrade_${subjectId}" placeholder="Enter your goal grade" oninput="delayedSave()">
        </div>
        <div id="assessments_${subjectId}">
            <h3>Assessments</h3>
        </div>
        <div class="input-group">
            <button onclick="addAssessmentItem('${subjectId}')">Add Assessment Item</button>
        </div>
       
        <div class="results" id="results_${subjectId}"></div>
    `;
    document.querySelector('.container').appendChild(content);
}

function addAssessmentItem(subjectId) {
    const assessmentId = `assessment_${document.querySelectorAll(`#${subjectId} .assessment-item`).length}`;
    const assessmentDiv = document.createElement('div');
    assessmentDiv.className = 'assessment-item';
    console.log(subjectId);
    assessmentDiv.innerHTML = `
        <input type="number" id="${subjectId}_${assessmentId}_weight" placeholder="Weight (%)" oninput="delayedSave(subjectId='${subjectId}')">
        <input type="number" id="${subjectId}_${assessmentId}_grade" placeholder="Achieved (%)" oninput="delayedSave(subjectId='${subjectId}')">
        <button onclick="deleteAssessmentItem('${subjectId}', '${assessmentId}')">Delete</button>
    `;
    console.log(assessmentDiv);
    document.getElementById(`assessments_${subjectId}`).appendChild(assessmentDiv);
}

function deleteAssessmentItem(subjectId, assessmentId) {
    const assessmentDiv = document.querySelector(`#${subjectId} .assessment-item button[onclick="deleteAssessmentItem('${subjectId}', '${assessmentId}')"]`).parentElement;
    assessmentDiv.remove();
    delayedSave(subjectId=subjectId);
}

function deleteSubject(subjectId, tab) {
    const content = document.getElementById(subjectId);

    if (tab) {
        tab.remove();
    }
    if (content) {
        content.remove();
    }

    // Remove subject from subjects array
    subjects = subjects.filter((_, index) => `subject_${index}` !== subjectId);
    
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

function calculateNeededGrades(subjectId) {
    console.log(subjectId);
    
    console.log("ca");
    const goalGrade = parseFloat(document.getElementById(`goalGrade_${subjectId}`).value);
    const assessmentItems = document.querySelectorAll(`#${subjectId} .assessment-item`);
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
        document.getElementById(`results_${subjectId}`).innerText = 'Total weight exceeds 100%. Please adjust the weights.';
        return;
    }

    const neededGrade = ((goalGrade - currentGrade) / (remainingWeight / 100)).toFixed(2);

    document.querySelectorAll(`#${subjectId} .assessment-item`).forEach(item => {
        if (!item.children[1].value) {
            item.children[1].placeholder = `Need ${neededGrade}%`;
        }
    });

    document.getElementById(`results_${subjectId}`).innerText = `To achieve a ${goalGrade}% overall, you need to score at least ${neededGrade}% on the remaining assessments.`;
}

function updateSummary() {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = subjects.map((subject, index) => {
        const subjectId = `subject_${index}`;
        const goalGrade = document.getElementById(`goalGrade_${subjectId}`)?.value || 'N/A';

        return `
            <h3>${subject}</h3>
            <p>Goal Grade: ${goalGrade}%</p>
            <p>Assessment Items:</p>
            ${Array.from(document.querySelectorAll(`#${subjectId} .assessment-item`)).map((item, i) => {
                const weight = item.children[0]?.value || 'N/A';
                const grade = item.children[1]?.value || 'N/A';
                return `<p>Item ${i + 1}: Weight - ${weight}%, Achieved - ${grade}%</p>`;
            }).join('')}
        `;
    }).join('');
}

window.onload = () => {
    loadFromLocalStorage();
    showTab('summary');
};


function saveToLocalStorage() {
    console.log("saving to local storage");
    
    console.log(subjects);
    subjects.forEach((subject, index) => {
        const subjectId = `subject_${index}`;
        const goalGradeInput = document.getElementById(`goalGrade_${subjectId}`);
        if (goalGradeInput) {
            localStorage.setItem(`goalGrade_${subjectId}`, goalGradeInput.value);
        }
        const assessmentItems = Array.from(document.querySelectorAll(`#${subjectId} .assessment-item`)).map(item => {
            return {
                weight: item.children[0]?.value || '',
                grade: item.children[1]?.value || ''
            };
        });
        localStorage.setItem(`assessments_${subjectId}`, JSON.stringify(assessmentItems));
    });
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

function loadFromLocalStorage() {
    const storedSubjects = JSON.parse(localStorage.getItem('subjects')) || [];
    subjects = storedSubjects;
    console.log(subjects);
    subjects.forEach((subject, index) => {
        const subjectId = `subject_${index}`;
        createTab(subject, subjectId);
        createSubjectContent(subject, subjectId);
        const goalGradeInput = document.getElementById(`goalGrade_${subjectId}`);
        if (goalGradeInput) {
            goalGradeInput.value = localStorage.getItem(`goalGrade_${subjectId}`) || '';
        }
        const assessments = JSON.parse(localStorage.getItem(`assessments_${subjectId}`)) || [];
        assessments.forEach((assessment, i) => {
            addAssessmentItem(subjectId);
            const weightInput = document.getElementById(`${subjectId}_assessment_${i}_weight`);
            const gradeInput = document.getElementById(`${subjectId}_assessment_${i}_grade`);
            if (weightInput) {
                weightInput.value = assessment.weight || '';
            }
            if (gradeInput) {
                gradeInput.value = assessment.grade || '';
            }
        });

        calculateNeededGrades(subjectId);
    });
}