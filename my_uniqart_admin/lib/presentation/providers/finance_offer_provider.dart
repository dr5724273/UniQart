import 'package:flutter/foundation.dart';
import '../../domain/entities/finance_offer_entity.dart';
import '../../domain/repositories/finance_offer_repository.dart';
import '../../data/repositories/finance_offer_repository_impl.dart';

class FinanceOfferProvider extends ChangeNotifier {
  final FinanceOfferRepository _repository;

  List<FinanceOfferEntity> _pendingOffers = [];
  bool _isLoading = false;
  String? _errorMessage;

  FinanceOfferProvider({FinanceOfferRepository? repository})
      : _repository = repository ?? FinanceOfferRepositoryImpl();

  List<FinanceOfferEntity> get pendingOffers => _pendingOffers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchPendingOffers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _pendingOffers = await _repository.getPendingOffers();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitDecision(String offerId, String action, {String? adminNote, String? publicNote}) async {
    try {
      await _repository.submitDecision(offerId, action, adminNote: adminNote, publicNote: publicNote);
      _pendingOffers.removeWhere((o) => o.id == offerId);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }
}
