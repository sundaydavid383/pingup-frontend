import logo from './logo.png';
import sponsors from "./sponsors.png"
import groupuser from "./water.jpg"
import user1 from "./user2.jpg"
import user2 from "./user3.jpg"
import user3 from "./user4.jpg"
import story1 from "./story1.mp4"
import church1 from "./church10.jpg"
import church2 from "./church11.jpg"
import church3 from "./church12.jpg"
import church4 from "./church13.jpg"
import church5 from "./church14.jpg"
import church6 from "./church15.jpg"
import church7 from "./church7.jpg"
import church8 from "./church8.jpg"
import church9 from "./church6.jpg"



// ...add all your image imports here


const dummyStoriesData = [
  {
    id: 1,
    title: "Youth Revival",
    content: "What a powerful night of worship!",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop",
    background_color: "#1e293b",
    user: {
      full_name: "Sarah Johnson",
      username: "sarahjohnson",
      profile_image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop"
    }
  },
  {
    id: 2,
    title: "Bible Study",
    content: "Today's word was 🔥🔥🔥",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "video",
    media_url: story1,
    background_color: "#0f172a",
    user: {
      full_name: "Michael Smith",
      username: "michaelsmith",
      profile_image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop"
    }
  },
  {
    id: 3,
    title: "Choir Rehearsal",
    content: "Can't wait for Sunday service 🎶",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&auto=format&fit=crop",
    background_color: "#db2777",
    user: {
      full_name: "Emily Davis",
      username: "emilydavis",
      profile_image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop"
    }
  },
  {
    id: 4,
    title: "Outreach Program",
    content: "God is moving in the community ❤️",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "video",
    media_url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    background_color: "#ca8a04",
    user: {
      full_name: "Daniel Lee",
      username: "daniellee",
      profile_image: user1
    }
  },
  {
    id: 5,
    title: "Morning Devotion",
    content: "Start your day with prayer 🙏",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop",
    background_color: "#0d9488",
    user: {
      full_name: "Olivia Brown",
      username: "oliviabrown",
      profile_image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop"
    }
  },
  {
    id: 6,
    title: "Men's Fellowship",
    content: "Iron sharpens iron 💪",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "video",
    media_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    background_color: "#0f172a",
    user: {
      full_name: "James Wilson",
      username: "jameswilson",
      profile_image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&auto=format&fit=crop"
    }
  },
  {
    id: 7,
    title: "Sunday Service",
    content: "Blessed beyond measure 🙌",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "video",
    media_url: "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    background_color: "#4f46e5",
    user: {
      full_name: "Sophia Martinez",
      username: "sophiamartinez",
      profile_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop"
    }
  },
  {
    id: 8,
    title: "Youth Hangout",
    content: "Great fellowship and fun 🎉",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop",
    background_color: "#e11d48",
    user: {
      full_name: "Liam Thompson",
      username: "liamthompson",
      profile_image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop"
    }
  }
];
const dummyPostData = [
  {
    id: 1,
    user: {
      full_name: "David Sunday",
      username: "davidsunday",
      profile_image: church4,
      _id: "jgpoiht9turgj",
    },
    content:
      "God is good all the time! Just shared the Word with amazing teens today 🙌",
    image_urls: [church7],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: ["user123", "user456"],
    likes_count: 2,
    comments_count: 4,
    shared_count: 1,
  },
  {
    id: 2,
    user: {
      full_name: "Mary Grace",
      username: "marygrace",
      profile_image: church5,
      _id: "irgjirhjuh",
    },
    content: "We had an amazing youth worship session today 💖 #SpringsConnect",
    image_urls: [church6],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user789"],
    likes_count: 1,
    comments_count: 10,
    shared_count: 3,
  },
  {
    id: 3,
    user: {
      full_name: "John Praise",
      username: "johnpraise",
      profile_image: church8,
      _id: "jifeghjuhgifdhg",
    },
    content:
      "“Blessed are the pure in heart: for they shall see God.” – Matthew 5:8 ✨",
    image_urls: [church9],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    likes: [],
    likes_count: 0,
    comments_count: 1,
    shared_count: 0,
  },

  // ✅ New posts for better media tab variety
  {
    id: 4,
    user: {
      full_name: "John Doe",
      username: "john_d",
      profile_image:
        "https://images.unsplash.com/photo-1502767089025-6572583495b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u1",
    },
    content: "Enjoying the sunset vibes 🌅 #BlessedEvening",
    image_urls: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: ["user321", "user456", "user654"],
    likes_count: 3,
    comments_count: 5,
    shared_count: 2,
  },
  {
    id: 5,
    user: {
      full_name: "John Doe",
      username: "john_d",
      profile_image:
        "https://images.unsplash.com/photo-1502767089025-6572583495b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u1",
    },
    content: "New setup for coding sessions 🚀",
    image_urls: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user111", "user222"],
    likes_count: 2,
    comments_count: 8,
    shared_count: 1,
  },
  {
    id: 6,
    user: {
      full_name: "John Doe",
      username: "john_d",
      profile_image:
        "https://images.unsplash.com/photo-1502767089025-6572583495b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u1",
    },
    content: "Had a blessed outreach today 🙏",
    image_urls: [],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user987"],
    likes_count: 1,
    comments_count: 3,
    shared_count: 0,
  },

    {
    id: 7,
    user: {
      full_name: "David Sunday",
      username: "davidsunday",
      profile_image: church4,
      _id: "jgpoiht9turgj",
    },
    content:
      "God is good all the time! Just shared the Word with amazing teens today 🙌",
    image_urls: [church7],
    video_urls: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: ["user123", "user456"],
    likes_count: 2,
    comments_count: 4,
    shared_count: 1,
  },
  {
    id: 8,
    user: {
      full_name: "Mary Grace",
      username: "marygrace",
      profile_image: church5,
      _id: "irgjirhjuh",
    },
    content: "We had an amazing youth worship session today 💖 #SpringsConnect",
    image_urls: [church6],
    video_urls: [],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user789"],
    likes_count: 1,
    comments_count: 10,
    shared_count: 3,
  },
  {
    id: 9,
    user: {
      full_name: "John Praise",
      username: "johnpraise",
      profile_image: church8,
      _id: "jifeghjuhgifdhg",
    },
    content:
      "“Blessed are the pure in heart: for they shall see God.” – Matthew 5:8 ✨",
    image_urls: [church9],
    video_urls: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    likes: [],
    likes_count: 0,
    comments_count: 1,
    shared_count: 0,
  },

  // New image-only post
  {
    id: 10,
    user: {
      full_name: "John Doe",
      username: "john_d",
      profile_image:
        "https://images.unsplash.com/photo-1502767089025-6572583495b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u1",
    },
    content: "Enjoying the sunset vibes 🌅 #BlessedEvening",
    image_urls: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    video_urls: [],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: ["user321", "user456", "user654"],
    likes_count: 3,
    comments_count: 5,
    shared_count: 2,
  },

  // Image gallery post
  {
    id: 11,
    user: {
      full_name: "John Doe",
      username: "john_d",
      profile_image:
        "https://images.unsplash.com/photo-1502767089025-6572583495b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u1",
    },
    content: "New setup for coding sessions 🚀",
    image_urls: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    video_urls: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user111", "user222"],
    likes_count: 2,
    comments_count: 8,
    shared_count: 1,
  },

  // Video post (realistic, public URL)
  {
    id: 12,
    user: {
      full_name: "Sarah Joy",
      username: "sarahjoy",
      profile_image:
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u2",
    },
    content: "A short clip from our choir practice 🎶",
    image_urls: [],
    video_urls: [
      "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    ],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likes: ["user555", "user666", "user777"],
    likes_count: 3,
    comments_count: 2,
    shared_count: 1,
  },

  // Video + image post
  {
    id: 13,
    user: {
      full_name: "Michael Faith",
      username: "michaelfaith",
      profile_image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      _id: "u3",
    },
    content: "Highlights from our last outreach 📸🎥",
    image_urls: [
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    video_urls: [
      "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    ],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    likes: ["user888"],
    likes_count: 1,
    comments_count: 4,
    shared_count: 0,
  },
];

const advisite_brand = {
      link: "https://abnations.com",
      title: "Sponsored",
      image: sponsors,
      brand: "ABnations Telecom",
      description:
        "Get the best data plans and enjoy seamless connectivity with ABnations Telecom. Visit our website to learn more!"
};
const dummyRecentMessageData = [
  {
    conversation_id: "conv_001",
    last_message_id: "msg_101",
    sender: {
      _id: "user_123",
      full_name: "Sarah Johnson",
      profile_image_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
    },
    last_message: {
      text: "Hey, are you free for the meeting later today?",
      media_url: null,
      type: "text",
      timestamp: "2025-08-10T14:30:00Z"
    },
    unread_count: 2
  },
  {
    conversation_id: "conv_002",
    last_message_id: "msg_102",
    sender: {
      user_id: "user_456",
      full_name: "David Kim",
      profile_image_url: user2,
    },
    last_message: {
      text: "",
      media_url: "https://images.unsplash.com/photo-1602526216436-74aaf9e7f91d",
      type: "image",
      timestamp: "2025-08-10T10:15:00Z"
    },
    unread_count: 0
  },
  {
    conversation_id: "conv_003",
    last_message_id: "msg_103",
    sender: {
      user_id: "user_789",
      full_name: "Emily Carter",
      profile_image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
    },
    last_message: {
      text: "The presentation slides look great, thanks for sending them over!",
      media_url: null,
      type: "text",
      timestamp: "2025-08-09T18:45:00Z"
    },
    unread_count: 5
  }
];


 const dummyFollowersData = [ 
  {
    _id: "u1",
    full_name: "Aisha Bello",
    username: "aisha_b",
    profile_image: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Youth outreach coordinator active in church music and mentoring programs."
  },
  {
    _id: "u2",
    full_name: "Emeka Okoye",
    username: "emeka_o",
    profile_image: "https://randomuser.me/api/portraits/men/75.jpg",
    bio: "Men’s fellowship leader and community builder."
  }
];

 const dummyFollowingData = [
  {
    _id: "u3",
    full_name: "Chinelo Udo",
    username: "chinelo_u",
    profile_image: "https://randomuser.me/api/portraits/women/65.jpg",
    bio: "Children’s ministry teacher, creative storyteller and mentor."
  },
  {
    _id: "u4",
    full_name: "Tunde Ajayi",
    username: "tunde_a",
    profile_image: "https://randomuser.me/api/portraits/men/83.jpg",
    bio: "Event coordinator and ushering lead."
  }
];

 const dummyPendingConnectionsData = [
  {
    _id: "u5",
    full_name: "Rebecca Nwosu",
    username: "rebecca_n",
    profile_image: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Worship singer, songwriter, passionate prayer team member."
  }
];
const dummyConnectionsData = [
  {
    _id: "u6",
    full_name: "Samuel Wright",
    username: "sam_w",
    profile_image: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Media team expert skilled in video and photography.",
    location: "Lagos, Nigeria",
    followers: ["u1", "u2", "u3"]
  },
  {
    _id: "u7",
    full_name: "Joyce Eze",
    username: "joyce_e",
    profile_image: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Welcome desk volunteer, friendly face of the church.",
    location: "Abuja, Nigeria",
    followers: ["u1", "u4", "u5"]
  },
  {
    _id: "u8",
    full_name: "Michael Smith",
    username: "michael_s",
    profile_image: "https://randomuser.me/api/portraits/men/76.jpg",
    bio: "Youth leader passionate about mentoring teens.",
    location: "Port Harcourt, Nigeria",
    followers: []
  }
];
 const dummyMessageData = [
{
  _id: "msg_001",
  full_name: "Sarah Johnson",
  username: "sarah_j",
  profile_image: "https://randomuser.me/api/portraits/women/65.jpg",
  bio: "Frontend dev & youth mentor. Loves React, coffee, and late-night debugging sessions.",
  last_message: "Just pushed the update — refresh and check it out 🚀",
  message_count: 12,
  last_seen: "2025-08-15T16:45:00Z",
  messages: [
    {
      from_user_id: "u1",
      to_user_id: "u2",
      text: "Hey Sarah! Just refactored the navbar component. It’s so much cleaner now.",
      message_type: "text",
      media_url: null,
      createdAt: "2025-08-15T16:00:00Z",
    },
    {
      from_user_id: "u2",
      to_user_id: "u1",
      text: "",
      message_type: "audio",
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", // "Wow, I love when code gets cleaner. Feels like spring cleaning for the brain."
      createdAt: "2025-08-15T16:01:20Z",
    },
    {
      from_user_id: "u1",
      to_user_id: "u2",
      text: "Check this out! I added a dark mode toggle 🎨",
      message_type: "image",
      media_url: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=500&h=300&fit=crop", // code editor dark mode
      createdAt: "2025-08-15T16:03:45Z",
    },
    {
      from_user_id: "u2",
      to_user_id: "u1",
      text: "That looks slick! Did you animate the theme switch?",
      message_type: "text",
      media_url: null,
      createdAt: "2025-08-15T16:05:10Z",
    },
    {
      from_user_id: "u1",
      to_user_id: "u2",
      text: "",
      message_type: "audio",
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // "Yep, it fades smoothly. Totally worth the extra lines of CSS."
      createdAt: "2025-08-15T16:06:30Z",
    },
    {
      from_user_id: "u2",
      to_user_id: "u1",
      text: "Okay, but wait… my API call is returning `undefined` again 😭",
      message_type: "text",
      media_url: null,
      createdAt: "2025-08-15T16:08:15Z",
    },
    {
      from_user_id: "u1",
      to_user_id: "u2",
      text: "Let me see your code. Send me a screenshot.",
      message_type: "text",
      media_url: null,
      createdAt: "2025-08-15T16:09:00Z",
    },
    {
      from_user_id: "u2",
      to_user_id: "u1",
      text: "",
      message_type: "image",
      media_url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&h=300&fit=crop", // code snippet screenshot
      createdAt: "2025-08-15T16:10:30Z",
    },
    {
      from_user_id: "u1",
      to_user_id: "u2",
      text: "Ah, I see it — you forgot to `return` the data from your fetch call.",
      message_type: "text",
      media_url: null,
      createdAt: "2025-08-15T16:12:00Z",
    },
    {
      from_user_id: "u2",
      to_user_id: "u1",
      text: "",
      message_type: "audio",
      media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // "Ohhh, rookie mistake. Fixed it now and it's working perfectly!"
      createdAt: "2025-08-15T16:13:20Z",
    },
    {
      from_user_id: "u1",
      to_user_id: "u2",
      text: "Nice! Just pushed the update — refresh and check it out 🚀",
      message_type: "text",
      media_url: null,
      createdAt: "2025-08-15T16:14:55Z",
    }
  ],
},
  {
    _id: "msg_002",
    full_name: "Michael Okafor",
    username: "mike_o",
    profile_image: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Men’s fellowship leader and sound engineer at church.",
    last_message: "I’ve updated the sound settings for Sunday service.",
    message_count: 5,
    last_seen: "2025-08-12T10:15:00Z",
    messages: [
      {
        from_user_id: "u1",
        to_user_id: "u3",
        text: "Hey Mike, did you adjust the sound desk?",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T08:50:00Z",
      },
      {
        from_user_id: "u3",
        to_user_id: "u1",
        text: "Yes, I’ve updated the settings for Sunday service.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T08:55:00Z",
      },
      {
        from_user_id: "u1",
        to_user_id: "u3",
        text: "Great! That’ll help during worship.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T08:57:00Z",
      },
      {
        from_user_id: "u3",
        to_user_id: "u1",
        text: "",
        message_type: "image",
        media_url: "https://via.placeholder.com/400x250.png?text=Sound+Desk",
        createdAt: "2025-08-14T08:59:00Z",
      },
    ],
  },
  {
    _id: "msg_003",
    full_name: "Grace Thompson",
    username: "grace_t",
    profile_image: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Children’s ministry teacher and prayer warrior.",
    last_message: "The kids really enjoyed the Bible quiz last week!",
    message_count: 7,
    last_seen: "2025-08-11T17:45:00Z",
    messages: [
      {
        from_user_id: "u4",
        to_user_id: "u1",
        text: "Hey, the kids had so much fun last Sunday!",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T07:20:00Z",
      },
      {
        from_user_id: "u1",
        to_user_id: "u4",
        text: "That’s amazing! God is good 🙌",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T07:21:00Z",
      },
      {
        from_user_id: "u4",
        to_user_id: "u1",
        text: "",
        message_type: "image",
        media_url: "https://via.placeholder.com/300x200.png?text=Bible+Quiz+Pics",
        createdAt: "2025-08-14T07:23:00Z",
      },
      {
        from_user_id: "u1",
        to_user_id: "u4",
        text: "We should plan another one for next month.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T07:25:00Z",
      },
      {
        from_user_id: "u4",
        to_user_id: "u1",
        text: "Yes! Maybe with a memory verse challenge too.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T07:27:00Z",
      },
    ],
  },
  {
    _id: "msg_004",
    full_name: "Daniel Adebayo",
    username: "dan_ade",
    profile_image: "https://randomuser.me/api/portraits/men/78.jpg",
    bio: "Ushering department and event coordinator.",
    last_message: "We’ll need more chairs for the event this Saturday.",
    message_count: 4,
    last_seen: "2025-08-12T09:05:00Z",
    messages: [
      {
        from_user_id: "u5",
        to_user_id: "u1",
        text: "We’ll need more chairs for the event this Saturday.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T06:45:00Z",
      },
      {
        from_user_id: "u1",
        to_user_id: "u5",
        text: "Alright, I’ll arrange that today.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T06:46:00Z",
      },
      {
        from_user_id: "u5",
        to_user_id: "u1",
        text: "Thank you! I’ll confirm the headcount later.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T06:48:00Z",
      },
    ],
  },
  {
    _id: "msg_005",
    full_name: "Esther Bello",
    username: "esther_b",
    profile_image: "https://randomuser.me/api/portraits/women/12.jpg",
    bio: "Young adults fellowship member and choir soprano.",
    last_message: "Practice session was fire today 🔥",
    message_count: 6,
    last_seen: "2025-08-12T15:00:00Z",
    messages: [
      {
        from_user_id: "u6",
        to_user_id: "u1",
        text: "Did you enjoy today’s choir practice?",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T06:00:00Z",
      },
      {
        from_user_id: "u1",
        to_user_id: "u6",
        text: "Yes! The harmonies were amazing.",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T06:02:00Z",
      },
      {
        from_user_id: "u6",
        to_user_id: "u1",
        text: "Can you send me the voice recording?",
        message_type: "text",
        media_url: null,
        createdAt: "2025-08-14T06:04:00Z",
      },
      {
        from_user_id: "u1",
        to_user_id: "u6",
        text: "",
        message_type: "audio",
        media_url: "https://example.com/choir-practice.mp3",
        createdAt: "2025-08-14T06:06:00Z",
      },
    ],
  },
];
const currentUser = {
  _id: "u1",
  full_name: "John Doe",
  username: "john_d",
  profile_image: "https://randomuser.me/api/portraits/men/75.jpg",
  bio: "Passionate about tech, ministry, and helping others grow.",
  location: "Lagos, Nigeria",
  createdAt: "2023-02-15T10:30:00Z", // joined date for 'Joined X ago'
  followers: ["u6", "u7"], // People following John
  following: ["u8"],       // People John is following
  connections: ["u6", "u7", "u8"] // Friends or church network
};
const dummyNotifications = [
  {
    _id: "1",
    type: "connection",
    text: "John Doe sent you a connection request",
    isRead: false,
    createdAt: new Date("2025-08-26T12:30:00"),
  },
  {
    _id: "2",
    type: "message",
    text: "You received a new message from Sarah",
    isRead: true,
    createdAt: new Date("2025-08-26T10:00:00"),
  },
  {
    _id: "3",
    type: "system",
    text: "Your password was changed successfully",
    isRead: false,
    createdAt: new Date("2025-08-25T18:45:00"),
  },
  {
    _id: "4",
    type: "custom",
    text: "Reminder: Choir practice at 5PM today",
    isRead: false,
    createdAt: new Date("2025-08-27T09:15:00"),
  },
];

  const bibleBooks = [
    { name: "Genesis", aliases: ["gen", "ge", "gn"] },
    { name: "Exodus", aliases: ["exod", "ex", "exo"] },
    { name: "Leviticus", aliases: ["lev", "lv"] },
    { name: "Numbers", aliases: ["num", "nm", "nu"] },
    { name: "Deuteronomy", aliases: ["deut", "dt"] },
    { name: "Joshua", aliases: ["josh", "jos", "jsh"] },
    { name: "Judges", aliases: ["judg", "jdg", "jg"] },
    { name: "Ruth", aliases: ["ruth", "ru"] },
    { name: "1 Samuel", aliases: ["1 sam", "1 sm", "i sam"] },
    { name: "2 Samuel", aliases: ["2 sam", "2 sm", "ii sam"] },
    { name: "1 Kings", aliases: ["1 kgs", "1 ki", "i kings"] },
    { name: "2 Kings", aliases: ["2 kgs", "2 ki", "ii kings"] },
    { name: "1 Chronicles", aliases: ["1 chron", "1 ch", "i chron"] },
    { name: "2 Chronicles", aliases: ["2 chron", "2 ch", "ii chron"] },
    { name: "Ezra", aliases: ["ezra", "ezr"] },
    { name: "Nehemiah", aliases: ["neh", "ne"] },
    { name: "Esther", aliases: ["esth", "es"] },
    { name: "Job", aliases: ["job"] },
    { name: "Psalms", aliases: ["ps", "psalm", "psa", "pss"] },
    { name: "Proverbs", aliases: ["prov", "pr", "prv"] },
    { name: "Ecclesiastes", aliases: ["eccl", "ecc", "qe"] },
    { name: "Song of Solomon", aliases: ["song", "ss", "song of sol"] },
    { name: "Isaiah", aliases: ["isa", "is"] },
    { name: "Jeremiah", aliases: ["jer", "je", "jr"] },
    { name: "Lamentations", aliases: ["lam", "la"] },
    { name: "Ezekiel", aliases: ["ezek", "ez", "eze"] },
    { name: "Daniel", aliases: ["dan", "dn"] },
    { name: "Hosea", aliases: ["hos", "ho"] },
    { name: "Joel", aliases: ["joel", "jl"] },
    { name: "Amos", aliases: ["amos", "am"] },
    { name: "Obadiah", aliases: ["obad", "ob"] },
    { name: "Jonah", aliases: ["jonah", "jon"] },
    { name: "Micah", aliases: ["mic", "mc"] },
    { name: "Nahum", aliases: ["nah", "na"] },
    { name: "Habakkuk", aliases: ["hab", "hb"] },
    { name: "Zephaniah", aliases: ["zeph", "zp"] },
    { name: "Haggai", aliases: ["hag", "hg"] },
    { name: "Zechariah", aliases: ["zech", "zc"] },
    { name: "Malachi", aliases: ["mal", "ml"] },
    { name: "Matthew", aliases: ["matt", "mathew"] },
    { name: "Mark", aliases: ["mark", "mk", "mrk"] },
    { name: "Luke", aliases: ["luke", "lk", "luk"] },
    { name: "John", aliases: ["john", "jn", "jhn"] },
    { name: "Acts", aliases: ["acts", "ac"] },
    { name: "Romans", aliases: ["rom", "ro", "rm"] },
    { name: "1 Corinthians", aliases: ["1 cor", "i cor", "1 co"] },
    { name: "2 Corinthians", aliases: ["2 cor", "ii cor", "2 co"] },
    { name: "Galatians", aliases: ["gal", "ga"] },
    { name: "Ephesians", aliases: ["eph", "ep"] },
    { name: "Philippians", aliases: ["phil", "php", "pp"] },
    { name: "Colossians", aliases: ["col", "cl"] },
    { name: "1 Thessalonians", aliases: ["1 thess", "i thess", "1 th"] },
    { name: "2 Thessalonians", aliases: ["2 thess", "ii thess", "2 th"] },
    { name: "1 Timothy", aliases: ["1 tim", "i tim", "1 ti"] },
    { name: "2 Timothy", aliases: ["2 tim", "ii tim", "2 ti"] },
    { name: "Titus", aliases: ["titus", "ti"] },
    { name: "Philemon", aliases: ["philem", "phm"] },
    { name: "Hebrews", aliases: ["heb", "he"] },
    { name: "James", aliases: ["jas", "jm"] },
    { name: "1 Peter", aliases: ["1 pet", "i pet", "1 pe"] },
    { name: "2 Peter", aliases: ["2 pet", "ii pet", "2 pe"] },
    { name: "1 John", aliases: ["1 jn", "i jn", "1 jn"] },
    { name: "2 John", aliases: ["2 jn", "ii jn", "2 jn"] },
    { name: "3 John", aliases: ["3 jn", "iii jn", "3 jn"] },
    { name: "Jude", aliases: ["jude", "jd"] },
    { name: "Revelation", aliases: ["rev", "re", "rv"] },
  ];

  const bibleBooks2 = [
  { name: "Genesis", abbrev: "gn", aliases: ["gen", "ge", "gn"] },
  { name: "Exodus", abbrev: "ex", aliases: ["exod", "ex", "exo"] },
  { name: "Leviticus", abbrev: "lv", aliases: ["lev", "lv"] },
  { name: "Numbers", abbrev: "nm", aliases: ["num", "nm", "nu"] },
  { name: "Deuteronomy", abbrev: "dt", aliases: ["deut", "dt"] },
  { name: "Joshua", abbrev: "js", aliases: ["josh", "jos", "jsh"] },
  { name: "Judges", abbrev: "jud", aliases: ["judg", "jdg", "jg"] },
  { name: "Ruth", abbrev: "rt", aliases: ["ruth", "ru"] },
  { name: "1 Samuel", abbrev: "1sm", aliases: ["1 sam", "1 sm", "i sam"] },
  { name: "2 Samuel", abbrev: "2sm", aliases: ["2 sam", "2 sm", "ii sam"] },
  { name: "1 Kings", abbrev: "1kgs", aliases: ["1 kgs", "1 ki", "i kings"] },
  { name: "2 Kings", abbrev: "2kgs", aliases: ["2 kgs", "2 ki", "ii kings"] },
  { name: "1 Chronicles", abbrev: "1ch", aliases: ["1 chron", "1 ch", "i chron"] },
  { name: "2 Chronicles", abbrev: "2ch", aliases: ["2 chron", "2 ch", "ii chron"] },
  { name: "Ezra", abbrev: "ezr", aliases: ["ezra", "ezr"] },
  { name: "Nehemiah", abbrev: "ne", aliases: ["neh", "ne"] },
  { name: "Esther", abbrev: "et", aliases: ["esth", "es"] },
  { name: "Job", abbrev: "job", aliases: ["job"] },
  { name: "Psalms", abbrev: "ps", aliases: ["ps", "psalm", "psa", "pss"] },
  { name: "Proverbs", abbrev: "prv", aliases: ["prov", "pr", "prv"] },
  { name: "Ecclesiastes", abbrev: "ec", aliases: ["eccl", "ecc", "qe"] },
  { name: "Song of Solomon", abbrev: "so", aliases: ["song", "ss", "song of sol"] },
  { name: "Isaiah", abbrev: "is", aliases: ["isa", "is"] },
  { name: "Jeremiah", abbrev: "jr", aliases: ["jer", "je", "jr"] },
  { name: "Lamentations", abbrev: "lm", aliases: ["lam", "la"] },
  { name: "Ezekiel", abbrev: "ez", aliases: ["ezek", "ez", "eze"] },
  { name: "Daniel", abbrev: "dn", aliases: ["dan", "dn"] },
  { name: "Hosea", abbrev: "ho", aliases: ["hos", "ho"] },
  { name: "Joel", abbrev: "jl", aliases: ["joel", "jl"] },
  { name: "Amos", abbrev: "am", aliases: ["amos", "am"] },
  { name: "Obadiah", abbrev: "ob", aliases: ["obad", "ob"] },
  { name: "Jonah", abbrev: "jn", aliases: ["jonah", "jon"] },
  { name: "Micah", abbrev: "mi", aliases: ["mic", "mc"] },
  { name: "Nahum", abbrev: "na", aliases: ["nah", "na"] },
  { name: "Habakkuk", abbrev: "hk", aliases: ["hab", "hb"] },
  { name: "Zephaniah", abbrev: "zp", aliases: ["zeph", "zp"] },
  { name: "Haggai", abbrev: "hg", aliases: ["hag", "hg"] },
  { name: "Zechariah", abbrev: "zc", aliases: ["zech", "zc"] },
  { name: "Malachi", abbrev: "ml", aliases: ["mal", "ml"] },
  { name: "Matthew", abbrev: "mt", aliases: ["matt", "mathew"] },
  { name: "Mark", abbrev: "mk", aliases: ["mark", "mrk"] },
  { name: "Luke", abbrev: "lk", aliases: ["luke", "luk"] },
  { name: "John", abbrev: "jo", aliases: ["john", "jn", "jhn"] },
  { name: "Acts", abbrev: "act", aliases: ["acts", "ac"] },
  { name: "Romans", abbrev: "rm", aliases: ["rom", "ro", "rm"] },
  { name: "1 Corinthians", abbrev: "1co", aliases: ["1 cor", "i cor", "1 co"] },
  { name: "2 Corinthians", abbrev: "2co", aliases: ["2 cor", "ii cor", "2 co"] },
  { name: "Galatians", abbrev: "gl", aliases: ["gal", "ga"] },
  { name: "Ephesians", abbrev: "eph", aliases: ["eph", "ep"] },
  { name: "Philippians", abbrev: "ph", aliases: ["phil", "php", "pp"] },
  { name: "Colossians", abbrev: "cl", aliases: ["col", "cl"] },
  { name: "1 Thessalonians", abbrev: "1ts", aliases: ["1 thess", "i thess", "1 th"] },
  { name: "2 Thessalonians", abbrev: "2ts", aliases: ["2 thess", "ii thess", "2 th"] },
  { name: "1 Timothy", abbrev: "1tm", aliases: ["1 tim", "i tim", "1 ti"] },
  { name: "2 Timothy", abbrev: "2tm", aliases: ["2 tim", "ii tim", "2 ti"] },
  { name: "Titus", abbrev: "tt", aliases: ["titus", "ti"] },
  { name: "Philemon", abbrev: "phm", aliases: ["philem", "phm"] },
  { name: "Hebrews", abbrev: "hb", aliases: ["heb", "he"] },
  { name: "James", abbrev: "jm", aliases: ["jas", "jm"] },
  { name: "1 Peter", abbrev: "1pe", aliases: ["1 pet", "i pet", "1 pe"] },
  { name: "2 Peter", abbrev: "2pe", aliases: ["2 pet", "ii pet", "2 pe"] },
  { name: "1 John", abbrev: "1jo", aliases: ["1 jn", "i jn", "1 jn"] },
  { name: "2 John", abbrev: "2jo", aliases: ["2 jn", "ii jn", "2 jn"] },
  { name: "3 John", abbrev: "3jo", aliases: ["3 jn", "iii jn", "3 jn"] },
  { name: "Jude", abbrev: "jd", aliases: ["jude", "jd"] },
  { name: "Revelation", abbrev: "re", aliases: ["rev", "re", "rv"] }
];

function capitalizeFullName(name = "") {
  return name
    .trim()
    .split(/\s+/) // handles multiple spaces
    .map(
      word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

const assets = {
    logo,
    groupuser,
    user1,
    user2,
    user3,
    dummyPostData,
    dummyStoriesData,
    advisite_brand,
    dummyRecentMessageData,
    dummyMessageData,
    dummyFollowersData,
    dummyFollowingData,
    dummyPendingConnectionsData,
    dummyConnectionsData,
    currentUser,
    dummyNotifications,
    capitalizeFullName,
    bibleBooks,
    bibleBooks2
    // ...list all images
};

export default assets;