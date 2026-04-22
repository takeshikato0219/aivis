import { StyleSheet } from 'react-native';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 5,
  },
  placeholder: {
    width: 32,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#161A21',
    borderRadius: 64,
    borderWidth: 2,
    borderColor: '#252f3a',
    marginHorizontal: 24,
    width: 170,
    alignSelf: 'center',
    shadowColor: '#273650',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20,
  },
  dateIconBtn: {
    paddingHorizontal: 8,
  },
  dateTextBtn: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  buttonIcon: {
    width: isTablet() ? 50 : 46,
    height: isTablet() ? 50 : 46,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  calendarStyle: {
    borderRadius: 12,
    width: '100%',
  },
  closeCalendarBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#2196f3',
    borderRadius: 8,
  },
  closeCalendarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backgroundImage: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
  },
  scrollViewStyle: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  pbScrollView: {
    paddingBottom: 40,
  },
  viewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  styleCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleText: {
    color: '#fff',
  },
  styleTextCenter: {
    color: '#fff',
    textAlign: 'center',
  },
  viewChild: {
    backgroundColor: '#1A202C',
    marginTop: 10,
    borderRadius: 22,
  },
  styleItem: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  viewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
    paddingHorizontal: 20,
  },
  viewItem2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 20,
  },
});
