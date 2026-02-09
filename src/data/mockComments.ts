export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export const mockComments: Comment[] = [
  // Original comments
  { id: 'c1', postId: 'post1', userId: 'u3', text: 'Totally agree! Their eggs benny is next level.', createdAt: '2025-01-28T10:15:00Z' },
  { id: 'c2', postId: 'post1', userId: 'u5', text: 'Need to try this place!', createdAt: '2025-01-28T11:00:00Z' },
  { id: 'c3', postId: 'post2', userId: 'u1', text: 'Hāpi Daze is my summer go-to as well', createdAt: '2025-01-27T19:30:00Z' },
  { id: 'c4', postId: 'post3', userId: 'u4', text: 'Such a powerful exhibition. Everyone should see it.', createdAt: '2025-01-27T16:00:00Z' },
  { id: 'c5', postId: 'post3', userId: 'u1', text: 'Free entry is amazing for something this good', createdAt: '2025-01-27T17:00:00Z' },
  { id: 'c6', postId: 'post3', userId: 'u2', text: 'Went last week, was blown away', createdAt: '2025-01-27T18:00:00Z' },
  { id: 'c7', postId: 'post4', userId: 'u1', text: 'Sunset from the top is unreal!', createdAt: '2025-01-26T18:00:00Z' },
  { id: 'c8', postId: 'post4', userId: 'u3', text: 'One of my favourite Wellington walks', createdAt: '2025-01-26T19:30:00Z' },
  { id: 'c9', postId: 'post7', userId: 'u5', text: 'The roses are incredible this time of year', createdAt: '2025-01-25T15:00:00Z' },
  { id: 'c10', postId: 'post12', userId: 'u1', text: 'Cuba St legend!', createdAt: '2025-01-22T10:00:00Z' },

  // New comments on gig/venue posts
  { id: 'c11', postId: 'post13', userId: 'u4', text: 'Was there! Incredible night. The encore was something else.', createdAt: '2025-01-29T00:00:00Z' },
  { id: 'c12', postId: 'post13', userId: 'u9', text: 'Wellington music scene is the best in NZ, no contest', createdAt: '2025-01-29T08:00:00Z' },
  { id: 'c13', postId: 'post14', userId: 'u6', text: 'Meow is the GOAT venue. Intimate but the sound is always dialled.', createdAt: '2025-01-28T23:00:00Z' },
  { id: 'c14', postId: 'post15', userId: 'u4', text: 'Wish I was there! Doom metal at Valhalla is always heavy.', createdAt: '2025-01-28T00:00:00Z' },
  { id: 'c15', postId: 'post17', userId: 'u6', text: 'Sticky floors are a feature not a bug 🎸', createdAt: '2025-01-25T00:00:00Z' },
  { id: 'c16', postId: 'post18', userId: 'u4', text: 'That balcony is the best spot in any Wellington venue', createdAt: '2025-01-23T22:00:00Z' },
  { id: 'c17', postId: 'post19', userId: 'u3', text: 'The garden sessions are so good in summer!', createdAt: '2025-01-26T17:00:00Z' },
  { id: 'c18', postId: 'post19', userId: 'u2', text: 'Great beer selection there too', createdAt: '2025-01-26T17:30:00Z' },
  { id: 'c19', postId: 'post38', userId: 'u9', text: 'Support local punk! This is what it is all about.', createdAt: '2025-01-25T23:00:00Z' },
  { id: 'c20', postId: 'post38', userId: 'u4', text: '$10 door for 4 bands is insane value', createdAt: '2025-01-26T00:00:00Z' },
  { id: 'c21', postId: 'post40', userId: 'u9', text: 'Was still dancing at 2am. My knees disagree with this lifestyle.', createdAt: '2025-01-24T10:00:00Z' },
  { id: 'c22', postId: 'post48', userId: 'u9', text: 'BATS is such a treasure. Tiny but mighty.', createdAt: '2025-01-20T23:00:00Z' },

  // New comments on food/coffee posts
  { id: 'c23', postId: 'post21', userId: 'u1', text: 'Loretta lamb shoulder is top 3 dishes in Wellington for me', createdAt: '2025-01-28T21:00:00Z' },
  { id: 'c24', postId: 'post22', userId: 'u1', text: 'Hillside is so underrated! The drive up is worth it', createdAt: '2025-01-27T22:30:00Z' },
  { id: 'c25', postId: 'post22', userId: 'u7', text: 'Been meaning to go here for months', createdAt: '2025-01-28T08:00:00Z' },
  { id: 'c26', postId: 'post23', userId: 'u5', text: 'Their croissants sell out by 9am. Set an alarm!', createdAt: '2025-01-28T09:00:00Z' },
  { id: 'c27', postId: 'post23', userId: 'u7', text: 'Can confirm, arrived at 9:30 and they were gone 😭', createdAt: '2025-01-28T10:00:00Z' },
  { id: 'c28', postId: 'post24', userId: 'u1', text: 'Their Ethiopian single origin is unreal right now', createdAt: '2025-01-27T10:00:00Z' },
  { id: 'c29', postId: 'post27', userId: 'u1', text: 'The hot sauce there is seriously next level', createdAt: '2025-01-24T14:00:00Z' },
  { id: 'c30', postId: 'post46', userId: 'u8', text: 'The BYO wine setup is such a good call. Great value for the quality.', createdAt: '2025-01-20T21:00:00Z' },

  // New comments on bar/drinks posts
  { id: 'c31', postId: 'post28', userId: 'u4', text: 'Hashigo always has the most interesting taps in town', createdAt: '2025-01-28T20:00:00Z' },
  { id: 'c32', postId: 'post30', userId: 'u8', text: 'The Library cocktails are next level. Try the Old Fashioned.', createdAt: '2025-01-26T22:00:00Z' },
  { id: 'c33', postId: 'post30', userId: 'u4', text: 'Best date spot in Welly for sure', createdAt: '2025-01-26T22:30:00Z' },

  // New comments on outdoors posts
  { id: 'c34', postId: 'post32', userId: 'u3', text: 'That sunrise light is incredible! What time did you go?', createdAt: '2025-01-28T07:00:00Z' },
  { id: 'c35', postId: 'post32', userId: 'u4', text: 'You are insane but I respect it', createdAt: '2025-01-28T08:00:00Z' },
  { id: 'c36', postId: 'post33', userId: 'u7', text: 'This photo is stunning. What camera are you using?', createdAt: '2025-01-27T20:00:00Z' },
  { id: 'c37', postId: 'post33', userId: 'u1', text: 'Golden hour from Mt Vic never gets old', createdAt: '2025-01-27T20:30:00Z' },
  { id: 'c38', postId: 'post36', userId: 'u7', text: 'Wellington sunsets are unmatched', createdAt: '2025-01-24T21:00:00Z' },
  { id: 'c39', postId: 'post44', userId: 'u3', text: 'Haha running down through the gardens is brave!', createdAt: '2025-01-21T10:00:00Z' },
  { id: 'c40', postId: 'post35', userId: 'u3', text: 'Love these bush tracks! So peaceful.', createdAt: '2025-01-25T08:00:00Z' },
];

export function getCommentsByPostId(postId: string): Comment[] {
  return mockComments.filter((c) => c.postId === postId);
}
