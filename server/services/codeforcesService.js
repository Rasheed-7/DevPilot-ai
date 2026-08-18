// server/services/codeforcesService.js

export const verifyCodeforcesUser = async (username) => {
  try {
    const response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.result || data.result.length === 0) {
      throw new Error('Codeforces account not found.');
    }

    const user = data.result[0];

    return {
      username: user.handle,
      rating: user.rating || null,
      maxRating: user.maxRating || null,
      rank: user.rank || null,
    };
  } catch (error) {
    if (error.message === 'Codeforces account not found.') {
      throw error;
    }
    console.error('Error verifying Codeforces user:', error);
    throw new Error('Failed to verify Codeforces account. Please try again.');
  }
};

export const getCodeforcesSubmissions = async (username) => {
  try {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error('Failed to fetch Codeforces submissions.');
    }

    return data.result || [];
  } catch (error) {
    console.error('Error fetching Codeforces submissions:', error);
    throw new Error('Failed to fetch Codeforces submissions. Please try again.');
  }
};

export const normalizeCodeforcesSubmission = (submission) => {
  const problem = submission.problem;
  const contestId = problem.contestId;
  const index = problem.index;
  const problemId = `${contestId}${index}`;

  // Map Codeforces difficulty to DevPilot difficulty
  let difficulty = 'Medium';
  if (problem.rating) {
    if (problem.rating <= 1200) difficulty = 'Easy';
    else if (problem.rating <= 2000) difficulty = 'Medium';
    else difficulty = 'Hard';
  }

  // Map Codeforces tags to DevPilot topics
  const topic = getBestTopic(problem.tags || []);

  return {
    title: problem.name,
    externalId: problemId,
    platform: 'Codeforces',
    difficulty: difficulty,
    topic: topic,
    solvedAt: new Date(submission.creationTimeSeconds * 1000),
    problemUrl: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
  };
};

// Map Codeforces tags to DevPilot topics
const mapCodeforcesTopic = (tag) => {
  const topicMap = {
    'arrays': 'Arrays',
    'strings': 'Strings',
    'sortings': 'Sorting',
    'data structures': 'Other',
    'dp': 'Dynamic Programming',
    'dynamic programming': 'Dynamic Programming',
    'graphs': 'Graphs',
    'graph': 'Graphs',
    'trees': 'Trees',
    'tree': 'Trees',
    'binary search': 'Binary Search',
    'bitmasks': 'Bit Manipulation',
    'bit manipulation': 'Bit Manipulation',
    'combinatorics': 'Math',
    'math': 'Math',
    'number theory': 'Math',
    'geometry': 'Math',
    'greedy': 'Greedy',
    'hashing': 'Hashing',
    'implementation': 'Other',
    'two pointers': 'Two Pointers',
    'sliding window': 'Sliding Window',
    'linked list': 'Linked List',
    'stack': 'Stack',
    'queue': 'Queue',
    'heap': 'Heap / Priority Queue',
    'priority queue': 'Heap / Priority Queue',
    'backtracking': 'Backtracking',
    'recursion': 'Recursion',
    'sorting': 'Sorting',
  };

  const normalizedTag = tag.toLowerCase().trim();
  return topicMap[normalizedTag] || null;
};

const getBestTopic = (tags) => {
  if (!tags || tags.length === 0) return 'Other';

  const priorityOrder = [
    'dp',
    'dynamic programming',
    'graphs',
    'trees',
    'binary search',
    'greedy',
    'hashing',
    'strings',
    'arrays',
    'sortings',
  ];

  for (const priorityTag of priorityOrder) {
    const found = tags.find((tag) =>
      tag.toLowerCase().trim() === priorityTag ||
      tag.toLowerCase().trim().includes(priorityTag)
    );
    if (found) {
      const mapped = mapCodeforcesTopic(found);
      if (mapped) return mapped;
    }
  }

  for (const tag of tags) {
    const mapped = mapCodeforcesTopic(tag);
    if (mapped) return mapped;
  }

  return 'Other';
};