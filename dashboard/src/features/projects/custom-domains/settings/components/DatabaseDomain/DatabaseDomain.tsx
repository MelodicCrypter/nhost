import { SettingsContainer } from '@/components/layout/SettingsContainer';
import { Input } from '@/components/ui/v2/Input';
import { useCurrentWorkspaceAndProject } from '@/features/projects/common/hooks/useCurrentWorkspaceAndProject';
import { VerifyDomain } from '@/features/projects/custom-domains/settings/components/VerifyDomain';
import { useState } from 'react';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  database_fqdn: Yup.string().required(),
});

export type DatabaseDomainFormValues = Yup.InferType<typeof validationSchema>;

export default function DatabaseDomain() {
  const [isVerified, setIsVerified] = useState(false);
  const { currentProject } = useCurrentWorkspaceAndProject();

  const [dbFQDN, setDbFQDN] = useState('');

  return (
    <SettingsContainer
      title="Database Domain"
      description="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout."
      docsLink="https://docs.nhost.io/"
      slotProps={{
        submitButton: {
          hidden: true,
        },
      }}
      className="grid grid-flow-row gap-y-4 gap-x-4 px-4 lg:grid-cols-5"
    >
      <Input
        id="database_fqdn"
        name="database_fqdn"
        type="string"
        fullWidth
        className="lg:col-span-2"
        placeholder="db.mydomain.dev"
        onChange={(e) => {
          setDbFQDN(e.target.value);
          setIsVerified(false);
        }}
        slotProps={{ inputRoot: { min: 1, max: 100 } }}
      />
      {/* TODO we need to check if the FQDN is valid or not */}
      {!isVerified && dbFQDN.length > 0 && (
        <div className="col-span-5 row-start-2">
          <VerifyDomain
            recordType="CNAME"
            hostname={dbFQDN}
            value={`${currentProject.subdomain}.db.${currentProject.region.domain}.`}
            onHostNameVerified={() => setIsVerified(true)}
          />
        </div>
      )}
    </SettingsContainer>
  );
}
