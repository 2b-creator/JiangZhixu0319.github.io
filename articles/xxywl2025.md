# 信息与未来代码

## p1
```cpp
#include <bits/stdc++.h>
using namespace std;
int cnt[15];
int main() {
	int a, b, ans = 0;
	scanf("%d%d", &a, &b);
	for (int i = a; i <= b; i++) {
		memset(cnt, 0, sizeof cnt);
		int t = i, ok = 1, maxn = -1;
		while (t) {
			cnt[t % 10]++;
			maxn = max(maxn, t % 10);
			if (cnt[t % 10] > 1) {
				ok = 0;
				break;
			}
			t /= 10;
		}
		for (int i = 0; i <= maxn; i++) {
			if (!cnt[i]) {
				ok = 0;
				break;
			}
		}
		ans += ok;
	}
	printf("%d", ans);
	return 0;
}
```

## p2
```cpp
#include <bits/stdc++.h>
#define int long long
using namespace std;
signed main() {
	int n, m, k, x, y;
	scanf("%lld%lld%lld", &n, &m, &k);
	x = (k - 1) / m + 1;
	y = (k - 1) % m + 1;
	printf("%lld %lld", x + y - 1, n - x + y);
	return 0;
}
```

## p3
```cpp
#include <bits/stdc++.h>
#define int long long
using namespace std;
const int N = 1e5 + 5, M = 5;
int a[N];
signed main() {
	int n, ans = 0;
	scanf("%lld", &n);
	for (int i = 1; i <= n; i++) { scanf("%lld", a + i); }
	sort(a + 1, a + n + 1, [](int x, int y) { return x > y; });
	for (int i = 1; i <= min(M, n); i++) {
		ans += a[i];
		for (int j = i + 1; j <= min(M, n); j++) a[j] = sqrt(a[j]);
	}
	ans += max(0ll, n - M);
	printf("%lld", ans);
	return 0;
}
```

## p4
```cpp
#include <bits/stdc++.h>
using namespace std;
map<string, int> mp;
vector<pair<string, string>> tg;
vector<pair<int, int>> g[20008];
bool vis[20008];
string s[20008];
int main() {
	ios::sync_with_stdio(0);
	cin.tie(0);
	cout.tie(0);
	int n, cnt = 0, ans = 0;
	cin >> n;
	for (int i = 1; i <= n; i++) {
		string u, a, b, v;
		cin >> u >> a >> b >> v;
		tg.push_back({u, v});
		if (!mp[u]) {
			mp[u] = ++cnt;
			s[cnt] = u;
		}
		if (!mp[v]) {
			mp[v] = ++cnt;
			s[cnt] = v;
		}
	}
	for (int i = 0; i < n; i++) {
		int u = mp[tg[i].first];
		int v = mp[tg[i].second];
		g[u].push_back({v, i + 1});
	}
	for (int a = 1; a <= cnt; a++) {
		for (pair<int, int> i : g[a]) {
			int b = i.first;
			vis[i.second] = 1;
			for (pair<int, int> j : g[b]) {
				if (vis[j.second])
					continue;
				int c = j.first;
				vis[j.second] = 1;
				for (pair<int, int> k : g[c]) {
					if (vis[k.second])
						continue;
					int d = k.first;
					vis[k.second] = 1;
					for (pair<int, int> l : g[d]) {
						if (l.first != a)
							continue;
						if (vis[l.second])
							continue;
						vis[l.second] = 1;
						int cnt1 = 0, cnt2 = 0;
						for (pair<int, int> e : g[b])
							if (e.first == d && !vis[e.second])
								cnt1++;
						for (pair<int, int> e : g[a])
							if (e.first == c && !vis[e.second])
								cnt2++;
						if (a == b && c == d)
							ans += cnt1 * (cnt1 - 1);
						else
							ans += cnt1 * cnt2;
						vis[l.second] = 0;
					}
					vis[k.second] = 0;
				}
				vis[j.second] = 0;
			}
			vis[i.second] = 0;
		}
	}
	cout << ans;
	return 0;
}
```

## p5
```cpp
#include <bits/stdc++.h>
using namespace std;
const int N = 300;
int dir_id(char dir) {
	switch (dir) {
	case 'S':
		return 0;
	case 'E':
		return 1;
	case 'N':
		return 2;
	case 'W':
		return 3;
	}
	return 0;
}
vector<vector<string>> turn_idx = {{}, {"LEFT"}, {"LEFT", "LEFT"}, {"RIGHT"}};
int dir, u, d, l, r;
char c;
void turn(int to) {
	for (string str : turn_idx[(to + 4 - dir) % 4]) {
		cout << str << '\n';
		cin >> c;
	}
	dir = to;
}
vector<int> dx = {1, 0, -1, 0}, dy = {0, 1, 0, -1};
vector<vector<int>> g(300, vector<int>(300));
void dfs(int x, int y) {
	g[x][y] = 1;
	for (int i = 0; i < 4; i++) {
		int tx = x + dx[i];
		int ty = y + dy[i];
		if (g[tx][ty])
			continue;
		turn(i);
		string ret;
		cout << "GO\n";
		cin >> ret;
		if (ret == "SUCC") {
			dfs(tx, ty);
			turn(i ^ 2);
			cout << "GO\n";
			cin >> ret;
		} else {
			g[tx][ty] = -1;
		}
	}
}
int main() {
	cout << "LEFT\n";
	cin >> c;
	dir = dir_id(c);
	dfs(N >> 1, N >> 1);
	for (int i = 0; i < N; i++)
		for (int j = 0; j < N; j++)
			if (g[i][j] == -1)
				d = i;
	for (int i = N - 1; i >= 0; i--)
		for (int j = 0; j < N; j++)
			if (g[i][j] == -1)
				u = i;
	for (int i = 0; i < N; i++)
		for (int j = 0; j < N; j++)
			if (g[j][i] == -1)
				r = i;
	for (int i = N - 1; i >= 0; i--)
		for (int j = 0; j < N; j++)
			if (g[j][i] == -1)
				l = i;
	cout << "END\n" << d - u + 1 << ' ' << r - l + 1 << '\n';
	for (int i = u; i <= d; i++) {
		for (int j = l; j <= r; j++) cout << (g[i][j] == 1 ? '.' : '#');
		cout << '\n';
	}
	return 0;
}
```

## p6
```cpp
#include <bits/stdc++.h>
using namespace std;
string to_zy(string s) {
	string ret;
	for (char i : s) {
		if (i == '\n')
			ret += "\\n";
		else if (i == '\"')
			ret += "\\\"";
		else if (i == '\\')
			ret += "\\\\";
		else
			ret.push_back(i);
	}
	return ret;
}
int main() {
	int n, k;
	cin >> n >> k;
	string s = to_string(k);
	for (int i = 2; i <= n; i++)
		s = "#include<iostream>\nint main(){std::cout<<\"" + to_zy(s) + "\";}";
	cout << s;
	return 0;
}

```