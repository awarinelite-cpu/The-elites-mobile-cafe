# DashboardPage.jsx — One Line Fix

Open src/pages/DashboardPage.jsx on GitHub.

Find this section (around line 19-30):

```
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drillOrder, setDrillOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToClientOrders(user.uid, data => { setOrders(data); setLoading(false); });
    return unsub;
  }, [user]);
```

ADD this new useEffect right after the existing one:

```
  // Redirect admin users to admin panel
  useEffect(() => {
    if (profile?.isAdmin) {
      navigate('/admin');
    }
  }, [profile, navigate]);
```

That's the only change needed in DashboardPage.jsx.
