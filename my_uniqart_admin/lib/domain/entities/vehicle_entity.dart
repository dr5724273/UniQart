class VehicleEntity {
  final String id;
  final String ownerName;
  final String ownerEmail;
  final String vehicleType;
  final String brand;
  final String model;
  final int year;
  final double pricePerDay;
  final String city;
  final String status;
  final List<String> images;
  final String createdAt;

  const VehicleEntity({
    required this.id,
    required this.ownerName,
    required this.ownerEmail,
    required this.vehicleType,
    required this.brand,
    required this.model,
    required this.year,
    required this.pricePerDay,
    required this.city,
    required this.status,
    required this.images,
    required this.createdAt,
  });
}
