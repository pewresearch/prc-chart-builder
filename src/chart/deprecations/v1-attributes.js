import v1BlockMetadata from '../block_v1.json';

// Use the actual v1 schema from block_v1.json
// This ensures WordPress can properly parse v1 blocks before migration
const v1Attributes = v1BlockMetadata.attributes;

export default v1Attributes;
