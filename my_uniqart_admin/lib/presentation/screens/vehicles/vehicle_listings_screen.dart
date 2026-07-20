import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';

class VehicleListingsScreen extends StatefulWidget {
  const VehicleListingsScreen({super.key});

  @override
  State<VehicleListingsScreen> createState() => _VehicleListingsScreenState();
}

class _VehicleListingsScreenState extends State<VehicleListingsScreen> {
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
      final res = await ApiClient.instance.get(ApiConstants.allVehicleListingsEndpoint);
      if (!mounted) return;
      setState(() => _items = (res['items'] as List?) ?? []);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleOffline(String id, bool currentIsOffline) async {
    setState(() => _processing[id] = true);
    try {
      await ApiClient.instance.patch(
        ApiConstants.vehicleOfflineEndpoint(id),
        body: {'isOffline': !currentIsOffline},
      );
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

  Future<void> _delete(String id, String vehicleName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: Text('Delete "$vehicleName"? This cannot be undone.'),
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
      await ApiClient.instance.delete(ApiConstants.vehicleDeleteEndpoint(id));
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
        title: const Text('Vehicle Listings'),
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
                      ? const Center(child: Text('No vehicle listings found.'))
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _items.length,
                          itemBuilder: (context, i) {
                            final v = _items[i];
                            final id = v['_id'] as String;
                            final isOffline = v['isOffline'] == true;
                            final status = v['status'] as String? ?? 'unknown';
                            final isBusy = _processing[id] == true;

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
                                            '${v['brand']} ${v['model']} (${v['year']})',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                          ),
                                        ),
                                        _statusChip(status),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Owner: ${v['ownerId']?['name'] ?? '-'}',
                                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          isOffline ? Icons.wifi_off_rounded : Icons.wifi_rounded,
                                          size: 14,
                                          color: isOffline ? Colors.red : Colors.green,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          isOffline ? 'OFFLINE' : 'ONLINE',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: isOffline ? Colors.red : Colors.green,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        OutlinedButton.icon(
                                          icon: Icon(isOffline ? Icons.wifi_rounded : Icons.wifi_off_rounded, size: 16),
                                          label: Text(isOffline ? 'Set Online' : 'Set Offline'),
                                          onPressed: isBusy ? null : () => _toggleOffline(id, isOffline),
                                        ),
                                        const SizedBox(width: 8),
                                        OutlinedButton.icon(
                                          icon: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                          label: const Text('Delete', style: TextStyle(color: Colors.red)),
                                          onPressed: isBusy ? null : () => _delete(id, '${v['brand']} ${v['model']}'),
                                        ),
                                        if (isBusy) ...[
                                          const SizedBox(width: 8),
                                          const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                                        ],
                                      ],
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
