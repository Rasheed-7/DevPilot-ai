// server/services/leetcodeService.js

const LEETCODE_API_BASE_URL = process.env.LEETCODE_API_BASE_URL || 'https://alfa-leetcode-api.onrender.com';

// Helper to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const verifyLeetCodeUser = async (username) => {
  try {
    // Try alfa-leetcode-api first
    try {
      const response = await fetch(`${LEETCODE_API_BASE_URL}/userProfile/${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.username) {
          return {
            username: data.username,
            ranking: data.ranking || null,
            solved: data.totalSolved || 0,
            realName: data.realName || null,
          };
        }
      }
    } catch (error) {
      console.log('Primary LeetCode API failed, trying GraphQL...');
    }

    // Fallback to GraphQL
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile {
            ranking
            realName
          }
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://leetcode.com/',
        'Origin': 'https://leetcode.com',
      },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!response.ok) {
      throw new Error('LeetCode account not found.');
    }

    const data = await response.json();

    if (!data.data || !data.data.matchedUser) {
      throw new Error('LeetCode account not found.');
    }

    const user = data.data.matchedUser;
    const totalSolved = user.submitStats?.acSubmissionNum?.find(
      (stat) => stat.difficulty === 'All'
    )?.count || 0;

    return {
      username: user.username,
      ranking: user.profile?.ranking || null,
      solved: totalSolved,
      realName: user.profile?.realName || null,
    };
  } catch (error) {
    console.error('Error verifying LeetCode user:', error);
    throw new Error('LeetCode account not found.');
  }
};

export const syncLeetCodeProblems = async (username) => {
  try {
    console.log(`Fetching solved problems for ${username}...`);

    // Try alfa-leetcode-api first (it has access to all solved problems)
    try {
      console.log('Attempting to fetch from alfa-leetcode-api...');
      
      const response = await fetch(`${LEETCODE_API_BASE_URL}/solved/${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 429) {
        console.log('Rate limited by alfa-leetcode-api, using GraphQL fallback...');
        return await syncFromGraphQL(username);
      }

      if (!response.ok) {
        console.log(`API returned ${response.status}, using GraphQL fallback...`);
        return await syncFromGraphQL(username);
      }

      const data = await response.json();
      
      if (!data || !data.solved || data.solved.length === 0) {
        console.log('No solved problems found');
        return await syncFromGraphQL(username);
      }

      console.log(`Found ${data.solved.length} solved problems from alfa-leetcode-api`);

      // Process all problems with delays to avoid rate limits
      const problems = [];
      let processed = 0;

      for (const problem of data.solved) {
        try {
          processed++;
          console.log(`Processing ${processed}/${data.solved.length}: ${problem.titleSlug}`);
          
          // Add delay between requests
          if (processed > 1) {
            await delay(200);
          }

          const detailResponse = await fetch(`${LEETCODE_API_BASE_URL}/select/${problem.titleSlug}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            const topic = getBestTopic(detailData.topicTags || []);
            
            problems.push({
              title: detailData.title || problem.title || problem.titleSlug,
              titleSlug: problem.titleSlug,
              difficulty: detailData.difficulty || problem.difficulty || 'Medium',
              problemLink: `https://leetcode.com/problems/${problem.titleSlug}/`,
              topicTags: detailData.topicTags || [],
              topic: topic,
              timestamp: problem.timestamp || null,
            });
          } else {
            // Fallback: use basic info without details
            problems.push({
              title: problem.title || problem.titleSlug,
              titleSlug: problem.titleSlug,
              difficulty: problem.difficulty || 'Medium',
              problemLink: `https://leetcode.com/problems/${problem.titleSlug}/`,
              topicTags: [],
              topic: 'Other',
              timestamp: problem.timestamp || null,
            });
          }
        } catch (error) {
          console.error(`Error processing ${problem.titleSlug}:`, error.message);
          problems.push({
            title: problem.title || problem.titleSlug,
            titleSlug: problem.titleSlug,
            difficulty: problem.difficulty || 'Medium',
            problemLink: `https://leetcode.com/problems/${problem.titleSlug}/`,
            topicTags: [],
            topic: 'Other',
            timestamp: problem.timestamp || null,
          });
        }
      }

      console.log(`Successfully processed ${problems.length} problems from alfa-leetcode-api`);
      return { problems, fetched: problems.length };

    } catch (error) {
      console.log('Error with alfa-leetcode-api, using GraphQL fallback:', error.message);
      return await syncFromGraphQL(username);
    }

  } catch (error) {
    console.error('Error syncing LeetCode problems:', error);
    return { problems: [], fetched: 0, error: error.message };
  }
};

// GraphQL fallback - fetches from LeetCode directly
const syncFromGraphQL = async (username) => {
  try {
    console.log(`Using GraphQL fallback for ${username}...`);
    
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://leetcode.com/',
        'Origin': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { username, limit: 100 },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.recentAcSubmissionList) {
      console.log('No submissions found from GraphQL');
      return { problems: [], fetched: 0 };
    }

    const submissions = data.data.recentAcSubmissionList;
    console.log(`Found ${submissions.length} recent submissions from GraphQL`);

    const uniqueProblems = new Map();
    for (const sub of submissions) {
      if (!uniqueProblems.has(sub.titleSlug)) {
        uniqueProblems.set(sub.titleSlug, {
          title: sub.title,
          titleSlug: sub.titleSlug,
          timestamp: sub.timestamp,
        });
      }
    }

    console.log(`${uniqueProblems.size} unique problems from GraphQL`);

    const problems = [];
    const problemEntries = Array.from(uniqueProblems.entries());

    for (let i = 0; i < problemEntries.length; i++) {
      const [titleSlug, problem] = problemEntries[i];
      
      try {
        const detailQuery = `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              title
              titleSlug
              difficulty
              topicTags {
                name
              }
            }
          }
        `;

        const detailResponse = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://leetcode.com/',
            'Origin': 'https://leetcode.com',
          },
          body: JSON.stringify({
            query: detailQuery,
            variables: { titleSlug },
          }),
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const question = detailData.data?.question;
          
          if (question) {
            const topic = getBestTopic(question.topicTags?.map(t => t.name) || []);
            problems.push({
              title: question.title,
              titleSlug: question.titleSlug,
              difficulty: question.difficulty || 'Medium',
              problemLink: `https://leetcode.com/problems/${question.titleSlug}/`,
              topic: topic,
              topicTags: question.topicTags?.map(t => t.name) || [],
              timestamp: problem.timestamp,
            });
          }
        }

        if (i < problemEntries.length - 1) {
          await delay(500);
        }
      } catch (error) {
        console.error(`Error fetching details for ${titleSlug}:`, error.message);
      }
    }

    console.log(`Processed ${problems.length} problems from GraphQL`);
    return { problems, fetched: problems.length };
  } catch (error) {
    console.error('GraphQL fallback error:', error);
    return { problems: [], fetched: 0, error: error.message };
  }
};

export const mapLeetCodeTopic = (tag) => {
  const topicMap = {
    'array': 'Arrays',
    'string': 'Strings',
    'hash-table': 'Hashing',
    'two-pointers': 'Two Pointers',
    'sliding-window': 'Sliding Window',
    'linked-list': 'Linked List',
    'stack': 'Stack',
    'queue': 'Queue',
    'binary-search': 'Binary Search',
    'tree': 'Trees',
    'binary-tree': 'Trees',
    'binary-search-tree': 'Binary Search Tree',
    'heap': 'Heap / Priority Queue',
    'priority-queue': 'Heap / Priority Queue',
    'graph': 'Graphs',
    'greedy': 'Greedy',
    'backtracking': 'Backtracking',
    'dynamic-programming': 'Dynamic Programming',
    'recursion': 'Recursion',
    'bit-manipulation': 'Bit Manipulation',
    'sorting': 'Sorting',
    'math': 'Math',
    'database': 'Other',
    'design': 'Other',
    'simulation': 'Other',
    'matrix': 'Arrays',
    'string-matching': 'Strings',
  };

  const normalizedTag = tag.toLowerCase().trim();
  return topicMap[normalizedTag] || null;
};

export const getBestTopic = (tags) => {
  if (!tags || tags.length === 0) return 'Other';

  const priorityOrder = [
    'dynamic-programming',
    'graph',
    'tree',
    'linked-list',
    'stack',
    'queue',
    'heap',
    'hash-table',
    'two-pointers',
    'sliding-window',
    'binary-search',
    'array',
    'string',
    'sorting',
    'math',
  ];

  for (const priorityTag of priorityOrder) {
    const found = tags.find((tag) =>
      tag.toLowerCase().trim() === priorityTag ||
      tag.toLowerCase().trim().includes(priorityTag)
    );
    if (found) {
      const mapped = mapLeetCodeTopic(found);
      if (mapped) return mapped;
    }
  }

  for (const tag of tags) {
    const mapped = mapLeetCodeTopic(tag);
    if (mapped) return mapped;
  }

  return 'Other';
};