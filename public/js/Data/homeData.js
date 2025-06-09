
const featuredAuctions = [
    {
      id: 'AUC-2584',
      title: '2019 Honda City VX',
      category: 'Cars',
      image: 'car',
      currentBid: 575000,
      basePrice: 500000,
      bids: 32,
      endsIn: '23:45:12',
      status: 'active'
    },
    {
      id: 'AUC-3421',
      title: 'Royal Enfield Classic 350',
      category: 'Bikes',
      image: 'motorcycle',
      currentBid: 125000,
      basePrice: 100000,
      bids: 0,
      endsIn: '2d',
      status: 'upcoming',
      startingIn: '2d'
    },
    {
      id: 'AUC-4712',
      title: '3BHK Apartment, Andheri West',
      category: 'Properties',
      image: 'building',
      currentBid: 12250000,
      basePrice: 12000000,
      bids: 8,
      endsIn: '3d 05:12:33',
      status: 'active'
    },
    {
      id: 'AUC-1852',
      title: 'MacBook Pro M2 Pro',
      category: 'Electronics',
      image: 'laptop',
      currentBid: 135000,
      basePrice: 120000,
      bids: 15,
      endsIn: '12:35:45',
      status: 'active'
    }
  ];
  
  // Ending Soon Auctions Data
  const endingSoonAuctions = [
    {
      id: 'AUC-3712',
      title: 'Vintage Gibson Les Paul',
      category: 'Music',
      image: 'guitar',
      currentBid: 275000,
      basePrice: 250000,
      bids: 14,
      endsIn: '5h 23m',
      status: 'active'
    },
    {
      id: 'AUC-3547',
      title: 'Rolex Submariner',
      category: 'Watches',
      image: 'watch',
      currentBid: 850000,
      basePrice: 750000,
      bids: 23,
      endsIn: '2h 45m',
      status: 'active'
    },
    {
      id: 'AUC-3689',
      title: 'Diamond Necklace',
      category: 'Jewelry',
      image: 'gem',
      currentBid: 525000,
      basePrice: 500000,
      bids: 7,
      endsIn: '3h 12m',
      status: 'active'
    },
    {
      id: 'AUC-3621',
      title: 'Canon EOS R5',
      category: 'Electronics',
      image: 'camera',
      currentBid: 262000,
      basePrice: 250000,
      bids: 18,
      endsIn: '1h 15m',
      status: 'active'
    }
  ];
  
  // User Testimonials
  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      role: 'Car Enthusiast',
      image: 'user1',
      rating: 5,
      comment: 'I found my dream car at a great price. The bidding process was transparent and the customer service was exceptional.'
    },
    {
      id: 2,
      name: 'Rahul Mehta',
      role: 'Property Investor',
      image: 'user2',
      rating: 5,
      comment: 'As a real estate investor, I\'ve used many platforms, but this one offers the best selection and verification process.'
    },
    {
      id: 3,
      name: 'Anjali Patel',
      role: 'Tech Collector',
      image: 'user3',
      rating: 4,
      comment: 'The platform has helped me find rare collectibles and vintage tech items that I couldn\'t find anywhere else.'
    }
  ];
  
  // Categories Data
  const categories = [
    { id: 'all', name: 'All Categories', icon: 'th' },
    { id: 'cars', name: 'Cars', icon: 'car' },
    { id: 'bikes', name: 'Bikes', icon: 'motorcycle' },
    { id: 'properties', name: 'Properties', icon: 'building' },
    { id: 'land', name: 'Land', icon: 'map-marked-alt' },
    { id: 'electronics', name: 'Electronics', icon: 'laptop' },
    { id: 'jewelry', name: 'Jewelry', icon: 'gem' }
  ];
  
  // User Dashboard Data
  const userDashboard = {
    user: {
      name: 'John',
      isVerified: true,
      balance: 15000,
      pendingPayments: 135000,
      totalSpent: 148000
    },
    stats: {
      activeBids: 5,
      wonAuctions: 3,
      balance: 15000,
      watchlistItems: 8
    },
    myBids: [
      {
        id: 'AUC-2584',
        title: '2019 Honda City',
        category: 'Cars',
        image: 'car',
        yourBid: 55000,
        currentHighest: 75000,
        status: 'active',
        endsIn: '23:45:12'
      },
      {
        id: 'AUC-3421',
        title: 'Royal Enfield Classic 350',
        category: 'Bikes',
        image: 'motorcycle',
        yourBid: 0,
        currentHighest: 0,
        status: 'upcoming',
        endsIn: 'Starts in 2d'
      },
      {
        id: 'AUC-4712',
        title: '2BHK Apartment, Powai',
        category: 'Properties',
        image: 'building',
        yourBid: 9550000,
        currentHighest: 9800000,
        status: 'active',
        endsIn: '3d 05:12:33'
      }
    ],
    watchlist: [
      {
        id: 'AUC-1852',
        title: 'MacBook Pro M2 Pro',
        category: 'Electronics',
        image: 'laptop',
        basePrice: 120000,
        currentBid: 135000,
        endsIn: '12:35:45'
      },
      {
        id: 'AUC-2475',
        title: 'Canon EOS R5',
        category: 'Electronics',
        image: 'camera',
        basePrice: 250000,
        currentBid: 262000,
        endsIn: '1d 06:45:12'
      }
    ],
    wonAuctions: [
      {
        id: 'AUC-1632',
        title: 'iPhone 15 Pro Max',
        category: 'Electronics',
        image: 'mobile-alt',
        finalBid: 98000,
        wonOn: '15 April, 2025',
        paymentStatus: 'paid'
      },
      {
        id: 'AUC-1487',
        title: 'Sony 65" OLED TV',
        category: 'Electronics',
        image: 'tv',
        finalBid: 135000,
        wonOn: '10 April, 2025',
        paymentStatus: 'pending'
      },
      {
        id: 'AUC-2198',
        title: 'Sony WH-1000XM5',
        category: 'Electronics',
        image: 'headphones',
        finalBid: 25000,
        wonOn: '5 April, 2025',
        paymentStatus: 'paid'
      }
    ],
    payments: [
      {
        id: 'TXN-9854',
        type: 'deposit',
        amount: 10000,
        date: '18 April, 2025',
        status: 'completed'
      },
      {
        id: 'TXN-9785',
        type: 'deposit',
        amount: 10000,
        date: '18 April, 2025',
        status: 'completed'
      },
      {
        id: 'TXN-9785',
        type: 'payment',
        amount: 98000,
        date: '15 April, 2025',
        status: 'completed'
      },
      {
        id: 'TXN-9645',
        type: 'deposit',
        amount: 25000,
        date: '10 April, 2025',
        status: 'completed'
      },
      {
        id: 'TXN-9524',
        type: 'payment',
        amount: 25000,
        date: '5 April, 2025',
        status: 'completed'
      }
    ]
  };