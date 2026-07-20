import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class FinanceListingsScreen extends StatefulWidget {
  const FinanceListingsScreen({super.key});

  @override
  State<FinanceListingsScreen> createState() => _FinanceListingsScreenState();
}

class _FinanceListingsScreenState extends State<FinanceListingsScreen> {
  List<dynamic> _items = [];
  bool _loading = false;
  String? _error;
  final Map<String, bool> _processing = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient.instance.get(ApiConstants.allFinanceListingsEndpoint);
      if (!mounted) return;
      setState(() => _items = (res['items'] as List?) ?? []);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(String id, String label) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: Text('Delete "$label"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _processing[id] = true);
    try {
      await ApiClient.instance.delete(ApiConstants.financeOfferDeleteEndpoint(id));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => _processing.remove(id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finance Listings'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _items.isEmpty
                      ? const Center(child: Text('No finance offers found.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _items.length,
                          itemBuilder: (context, i) {
                            final f = _items[i];
                            final id = f['_id'] as String;
                            final status = f['status'] as String? ?? 'unknown';
                            final isBusy = _processing[id] == true;
                            final lender = f['lenderId'];

                            return Card(
                              margin: const EdgeInsets.only(bottom: 10),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '₹${f['minLoan']} – ₹${f['maxLoan']}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                          ),
                                        ),
                                        _statusChip(status),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Lender: ${lender?['name'] ?? '-'}',
                                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                                    ),
                                    Text(
                                      'Interest: ${f['interestRate']}% | Collateral: ${f['collateralRequired']}',
                                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                                    ),
                                    const SizedBox(height: 10),
                                    OutlinedButton.icon(
                                      icon: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                      label: const Text('Delete Offer', style: TextStyle(color: Colors.red)),
                                      onPressed: isBusy
                                          ? null
                                          : () => _delete(id, '₹${f['minLoan']} – ₹${f['maxLoan']}'),
                                    ),
                                    if (isBusy)
                                      const Padding(
                                        padding: EdgeInsets.only(top: 8),
                                        child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }

  Widget _statusChip(String status) {
    Color color;
    switch (status) {
      case 'approved':
        color = Colors.green;
        break;
      case 'rejected':
        color = Colors.red;
        break;
      default:
        color = Colors.orange;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
