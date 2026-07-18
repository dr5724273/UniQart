import '../../domain/entities/vehicle_entity.dart';

class VehicleModel extends VehicleEntity {
  const VehicleModel({
    required super.id,
    required super.ownerName,
    required super.ownerEmail,
    required super.vehicleType,
    required super.brand,
    required super.model,
    required super.year,
    required super.pricePerDay,
    required super.city,
    required super.status,
    required super.images,
    required super.createdAt,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    String ownerName = 'Unknown Owner';
    String ownerEmail = '';

    if (json['ownerId'] is Map) {
      final ownerMap = json['ownerId'] as Map;
      ownerName = (ownerMap['name'] ?? 'Unknown Owner').toString();
      ownerEmail = (ownerMap['email'] ?? '').toString();
    } else if (json['ownerName'] != null) {
      ownerName = json['ownerName'].toString();
    }

    List<String> parsedImages = [];
    if (json['images'] is List) {
      parsedImages = (json['images'] as List).map((e) => e.toString()).toList();
    }

    return VehicleModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      ownerName: ownerName,
      ownerEmail: ownerEmail,
      vehicleType: (json['vehicleType'] ?? 'car').toString(),
      brand: (json['brand'] ?? '').toString(),
      model: (json['model'] ?? '').toString(),
      year: int.tryParse(json['year']?.toString() ?? '2023') ?? 2023,
      pricePerDay: double.tryParse(json['pricePerDay']?.toString() ?? '0') ?? 0.0,
      city: (json['city'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      images: parsedImages,
      createdAt: (json['createdAt'] ?? '').toString(),
    );
  }
}
