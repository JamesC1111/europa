const corkButtons = document.querySelectorAll('.open-cork, .cork-marker');
const profile = document.getElementById('cork-profile');

corkButtons.forEach((button) => {
  button.addEventListener('click', () => {
    profile.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => profile.focus({ preventScroll: true }), 450);
  });
});

document.getElementById('quiz-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const answers = { q1: 'France', q2: 'official', q3: 'research' };
  const form = new FormData(event.currentTarget);
  const score = Object.entries(answers).filter(([question, answer]) => form.get(question) === answer).length;
  const result = document.getElementById('quiz-result');
  result.textContent = score === 3
    ? 'Three out of three — you have the key details.'
    : `${score} out of 3. Revisit the Cork–France profile and try again.`;
});
