import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

// A lightweight history item returned from all four endpoints
class HistoryItem {
  final String id;
  final String type; // vehicle | finance | loan | booking
  final String title;
  final String subtitle;
  final String status;
  final String? adminNote;
  final String? publicNote;
  final DateTime decidedAt;

  HistoryItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.status,
    this.adminNote,
    this.publicNote,
    required this.decidedAt,
  });
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  
  bool _isLoading = false;
  String? _error;
  final Map<String, List<HistoryItem>> _data = {
    'vehicle': [],
    'finance': [],
    'loan': [],
    'booking': [],
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final api = ApiClient().dio;
      final results = await Future.wait([
        api.get(ApiConstants.vehicleHistoryEndpoint, queryParameters: {'limit': 100}),
        api.get(ApiConstants.financeOfferHistoryEndpoint, queryParameters: {'limit': 100}),
        api.get(ApiConstants.loanRequestHistoryEndpoint, queryParameters: {'limit': 100}),
        api.get(ApiConstants.bookingHistoryEndpoint, queryParameters: {'limit': 100}),
      ]);

      final vehicles = _parseVehicles(results[0]);
      final finance = _parseFinance(results[1]);
      final loans = _parseLoans(results[2]);
      final bookings = _parseBookings(results[3]);

      setState(() {
        _data['vehicle'] = vehicles;
        _data['finance'] = finance;
        _data['loan'] = loans;
        _data['booking'] = bookings;
        _isLoading = false;
      });
    } on DioException catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.response?.data?['message']?.toString() ?? e.message ?? 'Failed to load history.';
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  List<HistoryItem> _parseVehicles(Response r) {
    final items = (r.data?['items'] as List?) ?? [];
    return items.map((v) {
      final owner = v['ownerId'] is Map ? v['ownerId'] : {};
      return HistoryItem(
        id: v['_id']?.toString() ?? '',
        type: 'vehicle',
        title: '${v['year']} ${v['brand']} ${v['model']}',
        subtitle: 'Lister: ${owner['name'] ?? 'Unknown'} (${owner['email'] ?? ''})',
        status: v['status']?.toString() ?? '',
        adminNote: v['adminNote']?.toString(),
        publicNote: v['publicNote']?.toString(),
        decidedAt: (DateTime.tryParse(v['updatedAt']?.toString() ?? '') ?? DateTime.now()).toLocal(),
      );
    }).toList();
  }

  List<HistoryItem> _parseFinance(Response r) {
    final items = (r.data?['items'] as List?) ?? [];
    return items.map((f) {
      final lender = f['lenderId'] is Map ? f['lenderId'] : {};
      return HistoryItem(
        id: f['_id']?.toString() ?? '',
        type: 'finance',
        title: '₹${f['totalAmount']} Finance Offer',
        subtitle: 'Lender: ${lender['name'] ?? 'Unknown'} (${lender['email'] ?? ''})',
        status: f['status']?.toString() ?? '',
        adminNote: f['adminNote']?.toString(),
        publicNote: f['publicNote']?.toString(),
        decidedAt: (DateTime.tryParse(f['updatedAt']?.toString() ?? '') ?? DateTime.now()).toLocal(),
      );
    }).toList();
  }

  List<HistoryItem> _parseLoans(Response r) {
    final items = (r.data?['items'] as List?) ?? [];
    return items.map((l) {
      final buyer = l['buyerId'] is Map ? l['buyerId'] : {};
      final lender = l['lenderId'] is Map ? l['lenderId'] : {};
      return HistoryItem(
        id: l['_id']?.toString() ?? '',
        type: 'loan',
        title: '₹${l['requestedAmount']} Loan Request',
        subtitle: 'Buyer: ${buyer['name'] ?? 'Unknown'} | Lender: ${lender['name'] ?? 'Unknown'}',
        status: l['status']?.toString() ?? '',
        adminNote: l['adminNote']?.toString(),
        publicNote: l['publicNote']?.toString(),
        decidedAt: (DateTime.tryParse(l['updatedAt']?.toString() ?? '') ?? DateTime.now()).toLocal(),
      );
    }).toList();
  }

  List<HistoryItem> _parseBookings(Response r) {
    final items = (r.data?['items'] as List?) ?? [];
    return items.map((b) {
      final vehicle = b['vehicleId'] is Map ? b['vehicleId'] : {};
      final buyer = b['buyerId'] is Map ? b['buyerId'] : {};
      return HistoryItem(
        id: b['_id']?.toString() ?? '',
        type: 'booking',
        title: '${vehicle['brand'] ?? 'Unknown'} ${vehicle['model'] ?? ''} Booking',
        subtitle: 'Buyer: ${buyer['name'] ?? 'Unknown'} (${buyer['email'] ?? ''})',
        status: b['status']?.toString() ?? '',
        adminNote: b['adminNote']?.toString(),
        publicNote: b['publicNote']?.toString(),
        decidedAt: (DateTime.tryParse(b['updatedAt']?.toString() ?? '') ?? DateTime.now()).toLocal(),
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Decision History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _load,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: [
            Tab(text: 'Vehicles (${_data['vehicle']!.length})'),
            Tab(text: 'Finance (${_data['finance']!.length})'),
            Tab(text: 'Loans (${_data['loan']!.length})'),
            Tab(text: 'Bookings (${_data['booking']!.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline_rounded, size: 64, color: colorScheme.error),
                        const SizedBox(height: 16),
                        Text(
                          'Failed to load history',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: _load,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildList(_data['vehicle']!, colorScheme, theme),
                    _buildList(_data['finance']!, colorScheme, theme),
                    _buildList(_data['loan']!, colorScheme, theme),
                    _buildList(_data['booking']!, colorScheme, theme),
                  ],
                ),
    );
  }

  Widget _buildList(List<HistoryItem> items, ColorScheme colorScheme, ThemeData theme) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_outline_rounded, size: 64, color: colorScheme.primary.withValues(alpha: 0.5)),
              const SizedBox(height: 16),
              Text(
                'No decisions yet',
                style: theme.textTheme.titleMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = items[index];
        final isApproved = item.status == 'approved';

        return Card(
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: (isApproved ? Colors.green : Colors.red).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isApproved ? Icons.check_circle_rounded : Icons.cancel_rounded,
                color: isApproved ? Colors.green.shade700 : Colors.red.shade700,
              ),
            ),
            title: Text(
              item.title,
              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(item.subtitle, style: theme.textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(
                  'Decided ${DateFormat('MMM dd, yyyy – hh:mm a').format(item.decidedAt.toLocal())}',
                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
                if (item.adminNote != null && item.adminNote!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    '🔒 Note: ${item.adminNote}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.secondary,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
                if (item.publicNote != null && item.publicNote!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    '📢 Public: ${item.publicNote}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.tertiary,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isApproved ? Colors.green.shade100 : Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                item.status.toUpperCase(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isApproved ? Colors.green.shade800 : Colors.red.shade800,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
