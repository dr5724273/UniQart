import '../../domain/entities/booking_entity.dart';

class BookingModel extends BookingEntity {
  BookingModel({
    required super.id,
    required super.vehicleId,
    required super.vehicleBrand,
    required super.vehicleModel,
    required super.vehicleYear,
    required super.pricePerDay,
    required super.buyerId,
    required super.buyerName,
    required super.buyerEmail,
    required super.buyerPhone,
    required super.listerId,
    required super.listerName,
    required super.listerEmail,
    required super.listerPhone,
    required super.pickupDate,
    required super.returnDate,
    required super.address,
    required super.status,
    super.adminNote,
    super.publicNote,
    required super.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final vehicle = json['vehicleId'] is Map ? json['vehicleId'] : {};
    final buyer = json['buyerId'] is Map ? json['buyerId'] : {};
    final lister = json['listerId'] is Map ? json['listerId'] : {};

    return BookingModel(
      id: json['_id']?.toString() ?? '',
      vehicleId: vehicle['_id']?.toString() ?? '',
      vehicleBrand: vehicle['brand']?.toString() ?? 'Unknown',
      vehicleModel: vehicle['model']?.toString() ?? 'Unknown',
      vehicleYear: (vehicle['year'] as num?)?.toInt() ?? 0,
      pricePerDay: (vehicle['pricePerDay'] as num?)?.toInt() ?? 0,
      buyerId: buyer['_id']?.toString() ?? '',
      buyerName: buyer['name']?.toString() ?? 'Unknown',
      buyerEmail: buyer['email']?.toString() ?? '',
      buyerPhone: buyer['phone']?.toString() ?? '',
      listerId: lister['_id']?.toString() ?? '',
      listerName: lister['name']?.toString() ?? 'Unknown',
      listerEmail: lister['email']?.toString() ?? '',
      listerPhone: lister['phone']?.toString() ?? '',
      pickupDate: DateTime.tryParse(json['pickupDate']?.toString() ?? '') ?? DateTime.now(),
      returnDate: DateTime.tryParse(json['returnDate']?.toString() ?? '') ?? DateTime.now(),
      address: json['address']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      adminNote: json['adminNote']?.toString(),
      publicNote: json['publicNote']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
