
  
  	const questionIcons = {
  	B: "asset/book.png",
  	W: "asset/wordlist.png",
};

  
    let allQuestions = []; // Store all questions from the CSV
    let questions = []; // Store questions for the current test
    let userAnswers = [];
    let userName = "";
    let selectedTestId = ""; // Store the selected Test ID
    let selectedMode = "normal"; 
    const questionsPerTest = 10; // Number of questions per test
    let sheetURL, scriptURL, failedWordSheetURL; // URLs will be loaded from config.json
    const helpClickedWords = new Set();
    
    
    // 🆕 Select Mode (normal/revision)
  function selectMode(mode) {
    selectedMode = mode;
    document.getElementById("modeSelect").classList.add("hidden");

    // In revision mode, skip test selection
    if (mode === "revision") {
      document.getElementById("formTitle").textContent = "Revision Mode";
      fetchAllDataForRevision()
    }
    else{
    document.getElementById("formTitle").textContent = "Vocabulary Test";
    fetchAllData(); // Fetch data after loading config
    }

    document.getElementById("nameForm").classList.remove("hidden");
    document.getElementById("testNumber").classList.remove("hidden");
  }

    // Fetch configuration from config.json
    async function fetchConfig() {
      try {
        const response = await fetch("config.json");
        const config = await response.json();
        sheetURL = config.sheetURL;
        scriptURL = config.scriptURL;
        failedWordSheetURL = config.failedSheetURL;
        
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    }
    
    
     async function fetchAllDataForRevision() {
      try {

        const response = await fetch(failedWordSheetURL);
        const data = await response.text();
        const rows = data.split("\n").slice(1); // Remove header row
        allQuestions = rows.map(row => {
          const [type,word, correctAnswer,sentence, ...options] = row.split(",");
          return { type,word, correctAnswer, sentence, options };
        });

        // Generate test options dynamically
        generateTestOptions("revision");
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    // Fetch all data from Google Sheets
    async function fetchAllData() {
      try {
      	console.log("accessing url "+ sheetURL);
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split("\n").slice(1); // Remove header row
        allQuestions = rows.map(row => {
          const [source,word, correctAnswer,sentence, ...options] = row.split(",");
          return { source,word, correctAnswer, sentence, options };
        });

        // Generate test options dynamically
        generateTestOptions("normal");
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    // Generate test options dynamically
    function generateTestOptions(mode) {
      const testNumberSelect = document.getElementById("testNumber");
      const totalTests = Math.ceil(allQuestions.length / questionsPerTest); // Calculate total tests

      // Clear existing options
      testNumberSelect.innerHTML = "";

      // Add options for each test
      for (let i = 1; i <= totalTests; i++) {
        const option = document.createElement("option");
        option.value = i;
        
        if(mode == "revision"){
        option.textContent = `RevisionTest ${i}`;
        }else{
         option.textContent = `Test ${i}`;
        }
        testNumberSelect.appendChild(option);
      }
    }

    // Start the test
    function startTest() {
      userName = document.getElementById("userName").value.trim();
      const testNumber = document.getElementById("testNumber").value;
      if(selectedMode == "revision"){
      selectedTestId = `RevisionTest ${testNumber}`; // Set the selected Test ID
      }else{
       selectedTestId = `Test ${testNumber}`; // Set the selected Test ID
      }
     

      if (!userName) {
        alert("Please enter your name!");
        return;
      }

      // Hide the name form and show the test section
      document.getElementById("nameForm").classList.add("hidden");
      document.getElementById("testSection").classList.remove("hidden");
	  document.getElementById("testHeading").innerText = "Vocabulary Test-"+testNumber
      // Load the selected test
      loadTest();
    }

    // Load the selected test
    function loadTest() {
      const testNumber = document.getElementById("testNumber").value;
      const startIndex = (testNumber - 1) * questionsPerTest; // Calculate the starting index
      questions = allQuestions.slice(startIndex, startIndex + questionsPerTest); // Get questions for the test
      renderTest();

      // Show the Submit button
      document.getElementById("submitButton").classList.remove("hidden");
    }

    // Render the test
  function renderTest() {
  const testDiv = document.getElementById("test");

  testDiv.innerHTML = questions.map((q, index) => {
  const icon = questionIcons[q.source] || questionIcons.W;
  return `
    <div class="question">
      <p>
        <strong>
        <img src="${icon}" 
               alt="icon" 
               style="width:16px; height:16px; vertical-align:middle; margin-right:4px;">
        ${index + 1}. ${q.word}</strong>
        <span class="help-icon" id="help-${index}" style="cursor: pointer; color: #007bff; margin-left: 8px;">&#9432;</span>
      </p>
      <p class="help-text" id="help-text-${index}" style="display: none; color: #555;">
        <em>${q.sentence}</em>
      </p>
      <div class="options">
        ${q.options.slice(0, 4).map((opt, i) => `
          <label>
            <input type="radio" name="q${index}" value="${opt.trim()}">
            ${opt.trim()}
          </label>
        `).join("")}
      </div>
    </div>
  `
  }).join("");

  // Add click listeners for help icons
  questions.forEach((q, index) => {
    const helpIcon = document.getElementById(`help-${index}`);
    const helpText = document.getElementById(`help-text-${index}`);

    helpIcon.addEventListener("click", () => {
    
      if(selectedMode == "revision"){
      
      alert("Don't try to be over smart. This time you are not allowed to see help text.")
      
      }else{
      const isVisible = helpText.style.display === "block";
      helpText.style.display = isVisible ? "none" : "block";
      
      if (!isVisible) {
    	helpClickedWords.add(q.word); // store word when help is shown
  	}

      console.log(`Help clicked for ${q.word} question ${index + 1}: ${isVisible ? "hidden" : "shown"}`);
      // You can replace the above console.log with your tracking logic if needed
      }
      
    });
  });
}

    // Submit the test
    async function submitTest() {
    

      userAnswers = [];
      const wrongWords = []; // Array to store wrong words
	  const helpUsed = [];
	  
      questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        userAnswers.push(selected ? selected.value : null);
        
        // Check if help was used for this word
    	if (helpClickedWords.has(q.word)) {
      		helpUsed.push(q.word);
    	}

        // Check if the answer is wrong
        if (selected && selected.value !== q.correctAnswer.trim()) {
          wrongWords.push({ word: q.word, correctAnswer: q.correctAnswer, userAnswer: selected.value, sentence: q.sentence });
        }
      });

      const score = calculateScore();
      //document.getElementById("score").innerHTML = `Your score: ${score} / ${questions.length}`;

      // Send data to Google Apps Script
      const data = { name: userName, score, wrongWords,helpUsed, testId: selectedTestId };
      try {
    		await saveScore(data);
  		} catch (err) {
    	console.error("Error saving score:", err);
    	alert("There was an issue submitting your test. Please try again.");
  	} finally {
    		// Hide loader once done
    		//document.getElementById("loader").classList.add("progress-bar-hidden");
  		}

      // Display the results page
      showResults(selectedTestId, score, wrongWords,helpUsed,userName);
    }

    // Calculate the score
    function calculateScore() {
      return questions.reduce((acc, q, index) => {
        return acc + (userAnswers[index] === q.correctAnswer.trim() ? 1 : 0);
      }, 0);
    }

    // Show the results page
    function showResults(testId, score, wrongWords,helpUsed,userName) {
    const resultsSection = document.getElementById("resultsSection");
      // Hide the test section
      document.getElementById("testSection").classList.add("hidden");
      // Display motivational message at the top of the results
	 document.getElementById("motivationMessage").innerHTML = getMotivationalMessage(score,userName);

      // Display Test ID and Score
      document.getElementById("testId").textContent = testId;
      document.getElementById("finalScore").textContent = `${score} / ${questions.length}`;
      

      // Display wrong answers
      const wrongAnswersDiv = document.getElementById("wrongAnswers");
      if (wrongWords == null || wrongWords.length === 0) {
           	wrongAnswersDiv.innerHTML = `<p class="vocab-superhero">Not a single oops! You’re basically a vocab superhero! 🦸‍♂️📝</p>`;
  	  }else{
      wrongAnswersDiv.innerHTML = wrongWords.map(w => `
        <div class="wrong-answer">
          <p><strong>Word:</strong> ${w.word}</p>
          <p><strong>Your Answer:</strong> <span class="user-answer">${w.userAnswer}</span></p>
          <p><strong>Correct Answer:</strong> <span class="correct-answer">${w.correctAnswer}</span></p>
          <p><strong>Sentence:</strong> <span class="correct-answer">${w.sentence}</span></p>
        </div>
      `).join("");
      }
      
      const helpSection = document.getElementById("helpWordsSection");

  	  	if (helpUsed == null || helpUsed.length === 0) {
           	helpSection.innerHTML = `<p class="vocab-superhero">Zero help, zero problems, 100% genius detected! 🧠🚀</p>`;
  	  	}
  	  	else{
  	   	const helpContent = helpUsed.map(word => {
    	const q = questions.find(q => q.word === word);
    	return `
     	 <div class="help-word-card">
        	<p><strong>${q.word}</strong></p>
        	<p><em>Meaning:</em> ${q.correctAnswer}</p>
        	<p><em>Sentence:</em> ${q.sentence}</p>
      	</div>
    	`;
  			}).join("");
  		helpSection.innerHTML = helpContent;
  		 // Show the results section
  		 }
  		
		resultsSection.classList.remove("hidden");

  		// **Scroll into view smoothly**
  		resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  			// Optional: focus for accessibility
  		//resultsSection.setAttribute("motivationMessage", "-1"); // Make it focusable
  		resultsSection.focus();
    }
    
    
function getMotivationalMessage(score, userName) {
  	let messages = [];

  if (score === 10) {
    messages = [
      `Outstanding, ${userName}! You nailed every question — a perfect score! 🌟`,
      `Flawless victory, ${userName}! You’re a true vocabulary master! 🏆`,
      `Incredible work, ${userName}! 10 out of 10 — pure excellence! 💫`,
      `Perfect score, ${userName}! Your hard work is shining through! ✨`
    ];
  } else if (score >= 8) {
    messages = [
      `Great job, ${userName}! You’re just a step away from perfection! 💪`,
      `Awesome performance, ${userName}! You clearly know your stuff! 🌟`,
      `Well done, ${userName}! That’s an excellent score — keep it up! 🎯`,
      `Fantastic work, ${userName}! Just a little more practice and you’ll be unstoppable! 🚀`
    ];
  } else if (score >= 5) {
    messages = [
      `Good effort, ${userName}! You’re improving steadily — keep practicing! 👍`,
      `Nice work, ${userName}! You’re halfway there — consistency is key! 🌱`,
      `Well tried, ${userName}! Keep learning and you’ll reach the top soon! 💫`,
      `Solid attempt, ${userName}! Keep building your vocabulary brick by brick! 🧱`
    ];
  } else if (score >= 3) {
    messages = [
      `Don’t worry, ${userName}! Every mistake is a chance to learn something new. 🌈`,
      `Keep going, ${userName}! You’re learning and that’s what truly matters! 🌱`,
      `You’re on the right path, ${userName}! A bit more practice will make a big difference! 💪`,
      `Stay positive, ${userName}! Learning takes time — you’ve got this! 🌟`
    ];
  } else {
    messages = [
      `Keep trying, ${userName}! Great achievements start with small steps. 🚀`,
      `Don’t give up, ${userName}! Every expert was once a beginner. 🌱`,
      `Believe in yourself, ${userName}! You can improve with every test. 💫`,
      `Keep pushing, ${userName}! Next time will definitely be better! 💪`
    ];
  }

  // Pick a random message from the selected category
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

    // Save the score and wrong words to Google Sheets
    async function saveScore(data) {
      try {
        const response = await fetch(scriptURL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const result = await response.text();
        console.log("Response from Google Apps Script:", result); // Log the response
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }

    // Load config when the page loads
    fetchConfig();