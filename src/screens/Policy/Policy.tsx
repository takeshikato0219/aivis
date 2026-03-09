import React, { useEffect, useState } from 'react';
import { View, StatusBar, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './Policy.style';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import policyService from '@api/policyService';

type PolicyParams = { type: 'privacy' | 'terms' };
type PolicyRouteProp = RouteProp<{ Policy: PolicyParams }, 'Policy'>;

const Policy = () => {
  const navigation = useNavigation();
  const route = useRoute<PolicyRouteProp>();
  const type = route.params?.type;
  const { t } = useTranslation();

  let title = '';
  if (type === 'terms') title = t('auth.termsOfUse');
  else if (type === 'privacy') title = t('auth.privacyPolicy');

  const [policyContent, setPolicyContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        const policyType = type === 'privacy' ? 1 : 2;
        const response = await policyService.getPolicies(policyType);
        if (response.items && response.items.length > 0) {
          setPolicyContent(response.items[0].content);
        } else {
          setPolicyContent('');
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    if (type) fetchPolicy();
  }, [type]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>

          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollViewPaddingBottom}
            showsVerticalScrollIndicator={false}
          >
            <View>
              {loading ? (
                <Text>{t('common.loading')}</Text>
              ) : policyContent ? (
                // eslint-disable-next-line react-native/no-inline-styles
                <Text style={{ color: '#fff' }}>{policyContent}</Text>
              ) : (
                // eslint-disable-next-line react-native/no-inline-styles
                <Text style={{ color: '#fff' }}>No Data</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Policy;
