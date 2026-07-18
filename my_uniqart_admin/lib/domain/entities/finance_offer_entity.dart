class FinanceOfferEntity {
  final String id;
  final String lenderName;
  final String lenderEmail;
  final double totalAmount;
  final double minLoan;
  final double maxLoan;
  final double interestRate;
  final List<int> durationMonths;
  final String collateralRequired;
  final String terms;
  final String status;
  final String createdAt;

  const FinanceOfferEntity({
    required this.id,
    required this.lenderName,
    required this.lenderEmail,
    required this.totalAmount,
    required this.minLoan,
    required this.maxLoan,
    required this.interestRate,
    required this.durationMonths,
    required this.collateralRequired,
    required this.terms,
    required this.status,
    required this.createdAt,
  });
}
