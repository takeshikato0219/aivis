import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StatusBar,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { styles } from './Policy.style';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '@assets/svg/icon-back.svg';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import policyService from '@/services/policyService';
import RenderHTML from 'react-native-render-html';

type PolicyParams = { type: 'privacy' | 'terms' };
type PolicyRouteProp = RouteProp<{ Policy: PolicyParams }, 'Policy'>;

const Policy = () => {
  const navigation = useNavigation();
  const route = useRoute<PolicyRouteProp>();
  const type = route.params?.type;
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

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

  const htmlStyles = useMemo(
    () => ({
      baseStyle: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'System',
      },
      tagsStyles: {
        body: { color: '#fff', fontSize: 16, lineHeight: 24 },
        p: { color: '#fff', fontSize: 16, marginVertical: 8, lineHeight: 24 },
        h1: { color: '#fff', fontSize: 32, fontWeight: '700', marginVertical: 24, lineHeight: 40 },
        h2: { color: '#fff', fontSize: 28, fontWeight: '700', marginVertical: 20, lineHeight: 36 },
        h3: { color: '#fff', fontSize: 22, fontWeight: '600', marginVertical: 16, lineHeight: 28 },
        h4: { color: '#fff', fontSize: 18, fontWeight: '600', marginVertical: 12, lineHeight: 24 },
        strong: { color: '#fff', fontWeight: '700' },
        b: { color: '#fff', fontWeight: '700' },
        a: { color: '#007bff', textDecorationLine: 'underline' },
        li: { color: '#fff', fontSize: 16, marginVertical: 4, lineHeight: 24 },
        ul: { color: '#fff', marginVertical: 8, paddingLeft: 20 },
        ol: { color: '#fff', marginVertical: 8, paddingLeft: 20 },
      },
    }),
    []
  );

  // Extracted policy content node
  let policyContentNode: React.ReactNode;
  if (policyContent) {
    policyContentNode = (
      <RenderHTML
        contentWidth={width}
        source={{ html: policyContent }}
        baseStyle={htmlStyles.baseStyle}
        // @ts-ignore
        tagsStyles={htmlStyles.tagsStyles}
      />
    );
  } else {
    policyContentNode = <Text style={styles.contentText}>{t('home.noData')}</Text>;
  }

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
            {!loading && <View>{policyContentNode}</View>}
          </ScrollView>
          {loading && (
            <View style={styles.uploadingOverlay} pointerEvents="auto">
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.uploadingText}>{t('faceUpload.uploading')}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Policy;
