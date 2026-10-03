export function getDiseaseLabel(option) {
    return option ? `${option.diseaseCode} - ${option.diseaseName}` : "";
}
