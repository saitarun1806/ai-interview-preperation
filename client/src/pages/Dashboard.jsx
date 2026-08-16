import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import api from "../services/api";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  
  
  
  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);
  const [resumeLoaded, setResumeLoaded] = useState(false); 
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  
  
  
  const [activeView, setActiveView] = useState(null); 
  const [interviewMenuOpen, setInterviewMenuOpen] = useState(false);

  
  
  
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  
  
  
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]); 
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [questionError, setQuestionError] = useState("");

  
  const [levelGrading, setLevelGrading] = useState(false);
  const [levelResult, setLevelResult] = useState(null); 

  
  
  
  const recognitionRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const startVoiceInput = (setText, setRecording) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    setVoiceError("");
    finalTranscriptRef.current = "";
    shouldKeepListeningRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; 
    recognition.continuous = true; 
    recognition.interimResults = true; 
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setRecording(true);
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${transcript} `;
        } else {
          interim += transcript;
        }
      }

      setText(`${finalTranscriptRef.current}${interim}`.trim());
    };

    recognition.onerror = (event) => {
      
      if (event.error === "aborted") return;

      console.error(event);

      if (event.error === "no-speech") {
        setVoiceError("Didn't catch that — try speaking a little louder or closer to the mic.");
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError("Microphone access is blocked. Allow mic access in your browser's site settings.");
        shouldKeepListeningRef.current = false;
      } else if (event.error === "network") {
        setVoiceError("Voice input needs an internet connection. Check your connection and try again.");
      } else {
        setVoiceError("Voice input hit an error. Please try again.");
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;

      
      
      if (shouldKeepListeningRef.current) {
        try {
          recognition.start();
        } catch {
          setRecording(false);
        }
      } else {
        setRecording(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    shouldKeepListeningRef.current = false;

    
    if (!isListeningRef.current) return;

    isListeningRef.current = false;
    recognitionRef.current?.stop();
  };

  
  
  
  const [questionPhase, setQuestionPhase] = useState("idle"); 
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(0);
  const [answerSecondsLeft, setAnswerSecondsLeft] = useState(0);

  const prepTimerRef = useRef(null);
  const answerTimerRef = useRef(null);

  
  const handleSubmitAnswerRef = useRef(() => {});

  const clearQuestionTimers = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    prepTimerRef.current = null;
    answerTimerRef.current = null;
  };

  const resetQuestionFlow = () => {
    clearQuestionTimers();
    window.speechSynthesis?.cancel();
    stopVoiceInput();
    setQuestionPhase("idle");
    setPrepSecondsLeft(0);
    setAnswerSecondsLeft(0);
  };

  
  
  const stopListeningManually = () => {
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
    setQuestionPhase("done");
    stopVoiceInput();
  };

  const askQuestionAloud = (questionText, setText, setRecording, onTimeUp) => {
    clearQuestionTimers();
    setText("");

    const SpeechSynthesisSupported = "speechSynthesis" in window;

    const beginPrepGap = () => {
      setQuestionPhase("prep");
      let secondsLeft = 10;
      setPrepSecondsLeft(secondsLeft);

      prepTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setPrepSecondsLeft(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
          beginListening();
        }
      }, 1000);
    };

    const beginListening = () => {
      setQuestionPhase("listening");
      startVoiceInput(setText, setRecording);

      let secondsLeft = 60;
      setAnswerSecondsLeft(secondsLeft);

      answerTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setAnswerSecondsLeft(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(answerTimerRef.current);
          answerTimerRef.current = null;
          stopVoiceInput();
          setQuestionPhase("done");
          onTimeUp();
        }
      }, 1000);
    };

    if (!SpeechSynthesisSupported) {
      
      beginPrepGap();
      return;
    }

    window.speechSynthesis.cancel();
    setQuestionPhase("speaking");

    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.onend = beginPrepGap;
    utterance.onerror = beginPrepGap;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  });

  useEffect(() => {
    return () => resetQuestionFlow();
  }, []);

  
  
  
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  
  
  
  const loadResume = async () => {
    try {
      const response = await api.get("/resume");
      setResume(response.data.resume);
      setActiveView((prev) => prev || "resume");
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error(err);
      }
    } finally {
      setResumeLoaded(true);
    }
  };

  useEffect(() => {
    loadResume();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setUploadError("");
    setUploadMessage("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError("Resume must be smaller than 5 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a resume.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadMessage("");

      const formData = new FormData();
      formData.append("resume", file);

      const response = await api.post("/resume/upload", formData);

      setUploadMessage(response.data.message);
      setFile(null);
      await loadResume();
      setActiveView("resume");
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.message || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  };

  
  
  
  const loadProgress = async () => {
    try {
      setProgressLoading(true);
      const response = await api.get("/interview/progress");
      setProgress(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProgressLoading(false);
    }
  };

  const openProgressView = async () => {
    setInterviewMenuOpen(false);
    setActiveView("progress");
    await loadProgress();
  };

  
  
  
  const openTechnicalInterview = async () => {
    setInterviewMenuOpen(false);
    setActiveView("technical");
    setActiveQuestion(null);
    setAnsweredQuestions([]);
    setLevelResult(null);
    setQuestionError("");
    await loadProgress();
  };

  
  
  
  
  
  const fetchQuestion = async () => {
    if (questionLoading || submittingAnswer || activeQuestion) return;

    setQuestionError("");
    setAnswerText("");

    try {
      setQuestionLoading(true);
      const response = await api.get("/interview/question");

      setActiveQuestion(response.data.question);
      setBatchIndex(response.data.questionIndex);
      setBatchTotal(response.data.totalQuestions);

      askQuestionAloud(
        response.data.question.question,
        setAnswerText,
        setIsRecordingAnswer,
        () => handleSubmitAnswerRef.current()
      );
    } catch (err) {
      console.error(err);

      if (err.response?.data?.message?.includes("All questions for this level are answered")) {
        setActiveQuestion(null);
        await loadProgress();
      }

      setQuestionError(err.response?.data?.message || "Failed to load question.");
    } finally {
      setQuestionLoading(false);
    }
  };

  
  
  
  const startCurrentLevel = async () => {
    
    if (questionLoading || submittingAnswer || activeQuestion) return;

    setAnsweredQuestions([]);
    setLevelResult(null);
    await fetchQuestion();
  };

  
  
  
  const handleSubmitAnswer = async () => {
    if (!activeQuestion || submittingAnswer) return;

    if (!answerText.trim()) {
      setQuestionError("Please type or record an answer before submitting.");
      return;
    }

    resetQuestionFlow();

    try {
      setSubmittingAnswer(true);
      setQuestionError("");

      const response = await api.post("/interview/answer", {
        answer: answerText,
      });

      setAnsweredQuestions((prev) => [...prev, { ...activeQuestion, answer: answerText }]);

      if (response.data.allAnswered) {
        setActiveQuestion(null);
        await submitLevelForGrading();
      } else {
        await fetchQuestion();
      }
    } catch (err) {
      console.error(err);

      if (err.response?.data?.message?.includes("already fully answered")) {
        setActiveQuestion(null);
        await loadProgress();
      }

      setQuestionError(err.response?.data?.message || "Failed to submit answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  
  const submitLevelForGrading = async () => {
    try {
      setLevelGrading(true);
      setQuestionError("");

      const response = await api.post("/interview/submit-level");

      setLevelResult(response.data);
      await loadProgress();
    } catch (err) {
      console.error(err);
      setQuestionError(err.response?.data?.message || "Failed to grade your answers.");
    } finally {
      setLevelGrading(false);
    }
  };

  const closeQuestionPanel = () => {
    resetQuestionFlow();
    setActiveQuestion(null);
    setAnsweredQuestions([]);
    setLevelResult(null);
    setAnswerText("");
    setQuestionError("");
  };

  
  
  
  const parsed = resume?.parsedData;
  const hasParsedData =
    parsed &&
    (parsed.name ||
      parsed.email ||
      parsed.phone ||
      parsed.summary ||
      (parsed.skills && parsed.skills.length > 0) ||
      (parsed.education && parsed.education.length > 0) ||
      (parsed.experience && parsed.experience.length > 0) ||
      (parsed.projects && parsed.projects.length > 0));

  const currentLevel = progress?.currentLevel || 1;

  const levelStatus = (level) => {
    if (level < currentLevel) return "passed";
    if (level === currentLevel) return "ongoing";
    return "locked";
  };

  
  
  
  return (
    <div className="dash">
      <nav className="dash-nav">
        <span className="dash-brand">Dashboard</span>

        {resume && (
          <div className="dash-nav-center">
            <button
              className={`nav-pill ${activeView === "resume" ? "nav-pill-active" : ""}`}
              onClick={() => setActiveView("resume")}
              type="button"
            >
              <span className="nav-pill-text" title={resume.fileName}>
                {resume.fileName}
              </span>
            </button>

            <button
              className={`nav-pill ${activeView === "upload" ? "nav-pill-active" : ""}`}
              onClick={() => {
                setFile(null);
                setUploadError("");
                setUploadMessage("");
                setActiveView("upload");
              }}
              type="button"
            >
              Update Resume
            </button>

            <button
              className={`nav-pill ${activeView === "progress" ? "nav-pill-active" : ""}`}
              onClick={openProgressView}
              type="button"
            >
              Progress
            </button>

            <div className="nav-dropdown">
              <button
                className={`nav-pill ${activeView === "technical" ? "nav-pill-active" : ""}`}
                onClick={() => setInterviewMenuOpen((v) => !v)}
                type="button"
              >
                Interview ▾
              </button>

              {interviewMenuOpen && (
                <div className="nav-dropdown-menu">
                  <button
                    className="nav-dropdown-item"
                    onClick={openTechnicalInterview}
                    type="button"
                  >
                    Technical Interview
                  </button>
                  <button
                    className="nav-dropdown-item nav-dropdown-item-disabled"
                    disabled
                    type="button"
                  >
                    HR Interview <span className="coming-soon-tag">Coming soon</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="dash-logout" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </nav>

      {(uploadMessage || uploadError) && (
        <div className="dash-nav-status">
          {uploadMessage && <span className="resume-message">{uploadMessage}</span>}
          {uploadError && <span className="resume-error">{uploadError}</span>}
        </div>
      )}

      <div className="dash-body">
        {}
        {resumeLoaded && !resume && (
          <div className="upload-hero">
            <div className="upload-hero-card">
              <h1>Upload your resume</h1>
              <p>Upload a PDF resume to get started with your dashboard.</p>

              <input
                className="upload-hero-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
              />

              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
                type="button"
              >
                {uploading ? "Processing…" : "Upload Resume"}
              </button>

              {uploadMessage && <p className="resume-message">{uploadMessage}</p>}
              {uploadError && <p className="resume-error">{uploadError}</p>}
            </div>
          </div>
        )}

        {}
        {resume && activeView === "upload" && (
          <div className="upload-hero">
            <div className="upload-hero-card">
              <h1>Update your resume</h1>
              <p>Upload a new PDF to replace your current resume.</p>

              <input
                className="upload-hero-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
              />

              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading || !file}
                type="button"
              >
                {uploading ? "Processing…" : "Upload Resume"}
              </button>

              {uploadMessage && <p className="resume-message">{uploadMessage}</p>}
              {uploadError && <p className="resume-error">{uploadError}</p>}
            </div>
          </div>
        )}

        {}
        {resume && activeView === "resume" && hasParsedData && (
          <section className="parsed-section">
            <h2>Resume Data</h2>

            <div className="parsed-grid">
              <div className="parsed-card">
                <h3>Contact</h3>
                <p><span className="parsed-label">Name:</span> {parsed.name || "—"}</p>
                <p><span className="parsed-label">Email:</span> {parsed.email || "—"}</p>
                <p><span className="parsed-label">Phone:</span> {parsed.phone || "—"}</p>
              </div>

              {parsed.summary && (
                <div className="parsed-card">
                  <h3>Summary</h3>
                  <p>{parsed.summary}</p>
                </div>
              )}

              {parsed.skills?.length > 0 && (
                <div className="parsed-card">
                  <h3>Skills</h3>
                  <div className="skill-tags">
                    {parsed.skills.map((skill, i) => (
                      <span className="skill-tag" key={i}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {parsed.education?.length > 0 && (
                <div className="parsed-card">
                  <h3>Education</h3>
                  {parsed.education.map((edu, i) => (
                    <div className="entry" key={i}>
                      <p className="entry-title">{edu.degree || "—"}</p>
                      <p className="entry-sub">
                        {edu.institution}
                        {edu.year ? ` · ${edu.year}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {parsed.experience?.length > 0 && (
                <div className="parsed-card">
                  <h3>Experience</h3>
                  {parsed.experience.map((exp, i) => (
                    <div className="entry" key={i}>
                      <p className="entry-title">
                        {exp.title}
                        {exp.company ? ` @ ${exp.company}` : ""}
                      </p>
                      <p className="entry-sub">{exp.duration}</p>
                      {exp.description && <p className="entry-desc">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {parsed.projects?.length > 0 && (
                <div className="parsed-card">
                  <h3>Projects</h3>
                  {parsed.projects.map((proj, i) => (
                    <div className="entry" key={i}>
                      <p className="entry-title">{proj.name || "—"}</p>
                      {proj.description && <p className="entry-desc">{proj.description}</p>}
                      {proj.technologies?.length > 0 && (
                        <div className="skill-tags">
                          {proj.technologies.map((tech, j) => (
                            <span className="skill-tag" key={j}>{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {resume && activeView === "resume" && !hasParsedData && (
          <p className="resume-empty">No structured data available for this resume yet.</p>
        )}

        {}
        {activeView === "progress" && (
          <section className="parsed-section">
            <h2>Interview Progress</h2>

            {progressLoading && <p className="resume-empty">Loading…</p>}

            {!progressLoading && progress && (
              <div className="parsed-grid">
                <div className="parsed-card">
                  <h3>Current Status</h3>
                  <p><span className="parsed-label">Current level:</span> {progress.currentLevel} / 100</p>
                  <p><span className="parsed-label">Pass threshold:</span> {progress.passThreshold}%</p>
                </div>

                {progress.history?.length > 0 && (
                  <div className="parsed-card">
                    <h3>Recent Attempts</h3>
                    {progress.history.slice().reverse().map((h, i) => (
                      <div className="entry" key={i}>
                        <p className="entry-title">
                          Level {h.level} · {h.type} · {h.topic}{" "}
                          {h.accuracy === null ? (
                            <span className="entry-sub">Not scored</span>
                          ) : (
                            <span className={h.passed ? "tag-pass" : "tag-fail"}>
                              {h.passed ? "Passed" : "Failed"}
                            </span>
                          )}
                        </p>
                        {h.accuracy !== null && <p className="entry-sub">Accuracy: {h.accuracy}%</p>}
                        {h.feedback && <p className="entry-desc">{h.feedback}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {}
        {activeView === "technical" && (
          <section className="parsed-section technical-section">
            <h2>Technical Interview</h2>

            {progressLoading && <p className="resume-empty">Loading…</p>}

            {!progressLoading && progress && (
              <>
                {questionLoading && <p className="resume-empty">Loading question…</p>}

                {!activeQuestion && !levelResult && !questionLoading && (
                  <div className="level-grid">
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((level) => {
                      const status = levelStatus(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          className={`level-tile level-tile-${status}`}
                          disabled={status !== "ongoing" || questionLoading}
                          onClick={status === "ongoing" ? startCurrentLevel : undefined}
                          title={
                            status === "passed"
                              ? `Level ${level} — passed`
                              : status === "ongoing"
                              ? `Level ${level} — in progress, click to answer`
                              : `Level ${level} — locked`
                          }
                        >
                          {status === "passed" && <span className="level-icon">✓</span>}
                          {status === "locked" && <span className="level-icon">🔒</span>}
                          <span className="level-number">{level}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeQuestion && (
                  <div className="parsed-card question-card">
                    <div className="question-card-header">
                      <h3>
                        Level {activeQuestion.level} · {activeQuestion.difficulty} · {activeQuestion.type}
                      </h3>
                      <button className="close-btn" onClick={closeQuestionPanel} type="button">✕</button>
                    </div>

                    <p className="question-topic">
                      Question {batchIndex + 1} of {batchTotal}
                    </p>
                    <p className="question-topic">Topic: {activeQuestion.topic}</p>
                    <p className="question-text">{activeQuestion.question}</p>

                    {questionPhase === "speaking" && (
                      <p className="mic-hint">🔊 Asking the question…</p>
                    )}
                    {questionPhase === "prep" && (
                      <p className="mic-hint">🕒 Get ready — recording starts in {prepSecondsLeft}s</p>
                    )}
                    {questionPhase === "listening" && (
                      <p className="mic-hint mic-hint-active">
                        🔴 Recording — {answerSecondsLeft}s left. Speak your answer.
                      </p>
                    )}

                    <textarea
                      className="answer-textarea"
                      rows={6}
                      placeholder="Your spoken answer will appear here…"
                      value={answerText}
                      readOnly
                    />

                    <div className="answer-actions">
                      <button
                        className="btn-primary"
                        onClick={handleSubmitAnswer}
                        disabled={submittingAnswer}
                        type="button"
                      >
                        {submittingAnswer
                          ? batchIndex + 1 >= batchTotal
                            ? "Submitting level…"
                            : "Saving…"
                          : "Submit Answer"}
                      </button>

                      {questionPhase === "listening" ? (
                        <button className="mic-btn mic-btn-active" onClick={stopListeningManually} type="button">
                          ⏹ Stop Recording
                        </button>
                      ) : (
                        <button
                          className="mic-btn"
                          onClick={() =>
                            askQuestionAloud(
                              activeQuestion.question,
                              setAnswerText,
                              setIsRecordingAnswer,
                              () => handleSubmitAnswerRef.current()
                            )
                          }
                          disabled={questionPhase === "speaking" || questionPhase === "prep"}
                          type="button"
                        >
                          🎤 Restart Recording
                        </button>
                      )}
                    </div>
                    {voiceError && <p className="resume-error">{voiceError}</p>}
                    {questionError && <p className="resume-error">{questionError}</p>}
                  </div>
                )}

                {levelGrading && (
                  <div className="parsed-card question-card">
                    <p className="resume-empty">Grading your answers for this level…</p>
                  </div>
                )}

                {levelResult && (
                  <div className="parsed-card question-card">
                    <div className="question-card-header">
                      <h3>Level {answeredQuestions[0]?.level ?? currentLevel} Results</h3>
                      <button className="close-btn" onClick={closeQuestionPanel} type="button">✕</button>
                    </div>

                    <div className={`answer-result ${levelResult.passed ? "answer-pass" : "answer-fail"}`}>
                      <p className="entry-title">
                        {levelResult.passed ? "Level Passed ✓" : "Not passed"} — Overall Score: {levelResult.overallScore}%
                      </p>
                      {levelResult.interviewFinished && (
                        <p className="entry-desc">🎉 Interview complete! Check your results.</p>
                      )}
                    </div>

                    {levelResult.results?.map((r, i) => {
                      const q = answeredQuestions[i];
                      return (
                        <div className="entry" key={i}>
                          <p className="entry-title">
                            {q?.topic || `Question ${i + 1}`}{" "}
                            {r.skipped ? (
                              <span className="entry-sub">Not scored</span>
                            ) : (
                              <span className={r.passed ? "tag-pass" : "tag-fail"}>
                                {r.accuracy}%
                              </span>
                            )}
                          </p>
                          {r.feedback && <p className="entry-desc">{r.feedback}</p>}
                        </div>
                      );
                    })}

                    <button className="btn-primary" onClick={closeQuestionPanel} type="button">
                      {levelResult.passed ? "Next Level" : "Close"}
                    </button>

                    {questionError && <p className="resume-error">{questionError}</p>}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;