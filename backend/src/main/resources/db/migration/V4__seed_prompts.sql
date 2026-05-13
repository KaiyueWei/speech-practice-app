

INSERT INTO prompts (text, mode, difficulty, category) VALUES

-- IMPROMPTU / EASY
('Describe your favourite meal and why it matters to you.', 'IMPROMPTU', 'EASY', 'Personal'),
('What is one hobby you would recommend to anyone and why?', 'IMPROMPTU', 'EASY', 'Lifestyle'),
('Talk about a place you love to visit in your city.', 'IMPROMPTU', 'EASY', 'Travel'),

-- IMPROMPTU / MEDIUM
('Should social media companies be responsible for the content users post? Give your view.', 'IMPROMPTU', 'MEDIUM', 'Technology'),
('Describe a time you had to make a difficult decision quickly. What did you learn?', 'IMPROMPTU', 'MEDIUM', 'Personal Growth'),
('Do you think remote work is better or worse for team culture? Defend your position.', 'IMPROMPTU', 'MEDIUM', 'Work'),

-- IMPROMPTU / HARD
('Artificial intelligence will eliminate more jobs than it creates. Agree or disagree?', 'IMPROMPTU', 'HARD', 'Technology'),
('How should governments balance economic growth with environmental protection?', 'IMPROMPTU', 'HARD', 'Policy'),

-- PREPARED / EASY
('Give a two-minute introduction to a topic you know well.', 'PREPARED', 'EASY', 'Knowledge Share'),
('Explain a concept from your field to someone with no background in it.', 'PREPARED', 'EASY', 'Teaching'),
('Describe a project you are proud of and walk us through what you built.', 'PREPARED', 'EASY', 'Portfolio'),

-- PREPARED / MEDIUM
('Present a solution to a problem you see in your industry or community.', 'PREPARED', 'MEDIUM', 'Problem Solving'),
('Pitch an app or product idea you have had. Cover the problem, solution, and target user.', 'PREPARED', 'MEDIUM', 'Entrepreneurship'),
('Explain the trade-offs of a technical or strategic decision you have faced.', 'PREPARED', 'MEDIUM', 'Decision Making'),

-- PREPARED / HARD
('Deliver a five-minute persuasive speech on a change you believe your organisation should make.', 'PREPARED', 'HARD', 'Leadership'),
('Present an evidence-based argument for a controversial policy position you hold.', 'PREPARED', 'HARD', 'Policy'),

-- INTERVIEW / EASY
('Tell me about yourself and your background.', 'INTERVIEW', 'EASY', 'Introduction'),
('What are your key strengths and how have you used them?', 'INTERVIEW', 'EASY', 'Self-Awareness'),
('Why are you interested in this role?', 'INTERVIEW', 'EASY', 'Motivation'),

-- INTERVIEW / MEDIUM
('Describe a situation where you had to deal with a difficult colleague. What did you do?', 'INTERVIEW', 'MEDIUM', 'Behavioural'),
('Tell me about a time you failed. What did you learn from it?', 'INTERVIEW', 'MEDIUM', 'Resilience'),
('How do you prioritise tasks when you have multiple competing deadlines?', 'INTERVIEW', 'MEDIUM', 'Time Management'),
('Describe a project where you had to learn a new skill quickly.', 'INTERVIEW',
 'MEDIUM', 'Adaptability'),

-- INTERVIEW / HARD
('Where do you see yourself in five years, and how does this role fit into that path?', 'INTERVIEW', 'HARD', 'Career Vision'),
('Describe a time you disagreed with your manager. How did you handle it?', 'INTERVIEW', 'HARD', 'Conflict Resolution'),

-- DEBATE / EASY
('Pets make better companions than plants. For or against?', 'DEBATE', 'EASY', 'Lifestyle'),
('Reading books is more valuable than watching documentaries. Defend your side.', 'DEBATE', 'EASY', 'Education'),

-- DEBATE / MEDIUM
('Universities should be tuition-free. Make the case for your assigned side.', 'DEBATE', 'MEDIUM', 'Education Policy'),
('City living is superior to rural living. Argue your position.', 'DEBATE', 'MEDIUM', 'Lifestyle'),
('Automation is ultimately good for workers. Take a side and defend it.', 'DEBATE', 'MEDIUM', 'Economy'),

-- DEBATE / HARD
('Surveillance technology in public spaces does more good than harm. Debate this.', 'DEBATE', 'HARD', 'Civil Liberties'),
('Wealthy nations have a moral obligation to accept climate refugees without limit. Argue your side.', 'DEBATE', 'HARD', 'Global Policy');