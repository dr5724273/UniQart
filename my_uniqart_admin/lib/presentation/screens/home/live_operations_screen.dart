import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class LiveOperationsScreen extends StatefulWidget {
  const LiveOperationsScreen({super.key});

  @override
  State<LiveOperationsScreen> createState() => _LiveOperationsScreenState();
}

class _LiveOperationsScreenState extends State<LiveOperationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _liveBookings = [];
  List<dynamic> _liveLoans = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ApiClient.instance;
      final bookRes = await api.get(ApiConstants.liveBookingsEndpoint);
      final loanRes = await api.get(ApiConstants.liveLoansEndpoint);
      if (!mounted) return;
      setState(() {
        _liveBookings = (bookRes['items'] as List?) ?? [];
        _liveLoans = (loanRes['items'] as List?) ?? [];
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Operations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Bookings (${_liveBookings.length})'),
            Tab(text: 'Loans (${_liveLoans.length})'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, style: const TextStyle(color: Colors.red)),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildBookingsList(),
                    _buildLoansList(),
                  ],
                ),
    );
  }

  Widget _buildBookingsList() {
    if (_liveBookings.isEmpty) {
      return const Center(child: Text('No active bookings right now.'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _liveBookings.length,
        itemBuilder: (context, i) {
          final b = _liveBookings[i];
          final vehicle = b['vehicleId'];
          final buyer = b['buyerId'];
          final lister = b['listerId'];
          final pickup = DateTime.tryParse(b['pickupDate'] ?? '')?.toLocal();
          final ret = DateTime.tryParse(b['returnDate'] ?? '')?.toLocal();
          final remaining = ret != null ? ret.difference(DateTime.now()) : Duration.zero;
          final remainHrs = remaining.inHours;
          final remainMins = remaining.inMinutes % 60;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${vehicle?['brand'] ?? ''} ${vehicle?['model'] ?? ''} (${vehicle?['year'] ?? ''})',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  _infoRow('Buyer', buyer?['name'] ?? '-'),
                  _infoRow('Lister', lister?['name'] ?? '-'),
                  _infoRow('Pickup', pickup != null ? _fmt(pickup) : '-'),
                  _infoRow('Return', ret != null ? _fmt(ret) : '-'),
                  _infoRow(
                    'Remaining',
                    remaining.isNegative ? 'Overdue' : '${remainHrs}h ${remainMins}m',
                    highlight: remaining.isNegative,
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('ACTIVE', style: TextStyle(color: Colors.blue, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoansList() {
    if (_liveLoans.isEmpty) {
      return const Center(child: Text('No active loans right now.'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _liveLoans.length,
        itemBuilder: (context, i) {
          final l = _liveLoans[i];
          final offer = l['financeOfferId'];
          final lender = offer?['lenderId'];
          final borrower = l['buyerId'];
          final createdAt = DateTime.tryParse(l['createdAt'] ?? '')?.toLocal();
          final duration = l['durationMonths'] ?? 0;
          final endDate = createdAt?.add(Duration(days: (30 * duration).toInt()));

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '₹${l['requestedAmount']} Loan',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  _infoRow('Borrower', borrower?['name'] ?? '-'),
                  _infoRow('Lender', lender?['name'] ?? '-'),
                  _infoRow('Duration', '$duration months'),
                  _infoRow('Start', createdAt != null ? _fmtDate(createdAt) : '-'),
                  _infoRow('End', endDate != null ? _fmtDate(endDate) : '-'),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('ACTIVE', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.5),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: highlight ? Colors.red : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _fmtDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
